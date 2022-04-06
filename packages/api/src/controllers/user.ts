import validator from "email-validator";
import { Request, RequestHandler, Router } from "express";
import jwt from "jsonwebtoken";
import ms from "ms";
import qs from "qs";
import Stripe from "stripe";
import { v4 as uuid } from "uuid";

import { products } from "../config";
import hash from "../hash";
import logger from "../logger";
import { authMiddleware, validatePost } from "../middleware";
import {
  CreateCustomer,
  CreateSubscription,
  PasswordResetTokenRequest,
  PasswordResetConfirm,
  UpdateSubscription,
  User,
  SuspendUserPayload,
} from "../schema/types";
import { db } from "../store";
import { InternalServerError, NotFoundError } from "../store/errors";
import { WithID } from "../store/types";
import {
  makeNextHREF,
  sendgridEmail,
  parseFilters,
  parseOrder,
  recaptchaVerify,
  sendgridValidateEmail,
  toStringValues,
  FieldsMap,
} from "./helpers";
import { terminateStreamReq } from "./stream";

const adminOnlyFields = ["verifiedAt", "planChangedAt"];

const salesEmail = "sales@livepeer.org";
const infraEmail = "infraservice@livepeer.org";

function cleanAdminOnlyFields(fields: string[], obj: Record<string, any>) {
  for (const f of fields) {
    delete obj[f];
  }
}

function cleanUserFields(user: WithID<User>, isAdmin = false) {
  if (!user) return user;

  user = db.user.cleanWriteOnlyResponse(user);
  if (!isAdmin) {
    cleanAdminOnlyFields(adminOnlyFields, user);
  }
  return user;
}

async function findUserByEmail(email: string, useReplica = true) {
  const [users] = await db.user.find({ email }, { useReplica });
  if (!users?.length) {
    throw new NotFoundError("user not found");
  } else if (users.length > 1) {
    throw new InternalServerError("multiple users found with same email");
  }
  return users[0];
}

const frontendUrl = (
  {
    headers: { "x-forwarded-proto": proto },
    config: { frontendDomain },
  }: Request,
  path: string
) => `${proto || "http"}://${frontendDomain}${path}`;

const unsubscribeUrl = (req: Request) => frontendUrl(req, "/contact");

export async function suspendUserStreams(
  req: Request,
  userId: string,
  suspended: boolean
): Promise<void> {
  const [streams] = await db.stream.find({ userId });
  for (const stream of streams) {
    try {
      const promises: Promise<any>[] = [
        db.stream.update(stream.id, { suspended }),
      ];
      if (suspended) {
        promises.push(terminateStreamReq(req, stream));
      }
      await Promise.all(promises);
    } catch (err) {
      logger.error(
        `error suspending stream id=${stream.id} userId=${userId} err=${err}`
      );
    }
  }
}

type StripeProductIDs = CreateSubscription["stripeProductId"];

const defaultProductId: StripeProductIDs = "prod_0";

async function getOrCreateCustomer(stripe: Stripe, email: string) {
  const existing = await stripe.customers.list({ email });
  if (existing.data.length > 0) {
    return existing.data[0];
  }
  return await stripe.customers.create({ email });
}

async function getOrCreateSubscription(
  stripe: Stripe,
  stripeProductId: StripeProductIDs,
  stripeCustomerId: string
) {
  const existing = await stripe.subscriptions.list({
    customer: stripeCustomerId,
  });
  if (existing.data.length > 0) {
    return existing.data[0];
  }

  const prices = await stripe.prices.list({
    lookup_keys: products[stripeProductId].lookupKeys,
  });
  return await stripe.subscriptions.create({
    cancel_at_period_end: false,
    customer: stripeCustomerId,
    items: prices.data.map((item) => ({ price: item.id })),
    expand: ["latest_invoice.payment_intent"],
  });
}

function requireStripe(): RequestHandler {
  return (req, res, next) => {
    if (!req.stripe) {
      return res.status(501).json({ errors: ["stripe not configured"] });
    }
    return next();
  };
}

const app = Router();

app.get("/usage", authMiddleware({}), async (req, res) => {
  let { userId, fromTime, toTime } = toStringValues(req.query);
  if (!fromTime || !toTime) {
    res.status(400);
    return res.json({ errors: ["should specify time range"] });
  }
  if (!userId || (req.user.admin !== true && req.user.id !== userId)) {
    userId = req.user.id;
  }

  const usageRes = await db.stream.usage(userId, fromTime, toTime, {
    useReplica: false,
  });
  res.status(200);
  res.json(usageRes);
});

const fieldsMap: FieldsMap = {
  id: `users.ID`,
  email: { val: `data->>'email'`, type: "full-text" },
  emailValid: { val: `data->'emailValid'`, type: "boolean" },
  admin: { val: `data->'admin'`, type: "boolean" },
  stripeProductId: `data->>'stripeProductId'`,
};

app.get("/", authMiddleware({ admin: true }), async (req, res) => {
  let { limit, cursor, order, filters } = toStringValues(req.query);
  if (isNaN(parseInt(limit))) {
    limit = undefined;
  }
  const query = parseFilters(fieldsMap, filters);
  const [output, newCursor] = await db.user.find(query, {
    limit,
    cursor,
    order: parseOrder(fieldsMap, order),
  });

  res.status(200);

  if (output.length > 0 && newCursor) {
    res.links({ next: makeNextHREF(req, newCursor) });
  }
  res.json(db.user.cleanWriteOnlyResponses(output));
});

app.get("/me", authMiddleware({ allowUnverified: true }), async (req, res) => {
  const user = await db.user.get(req.user.id);
  res.status(200);
  return res.json(cleanUserFields(user, req.user.admin));
});

app.get("/:id", authMiddleware({ allowUnverified: true }), async (req, res) => {
  if (req.user.admin !== true && req.user.id !== req.params.id) {
    return res.status(403).json({
      errors: ["user can only request information on their own user object"],
    });
  }
  const user = await db.user.get(req.params.id);
  res.status(200);
  res.json(cleanUserFields(user, req.user.admin));
});

app.post("/", validatePost("user"), async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    organization,
    phone,
    recaptchaToken,
  } = req.body;

  const { selectedPlan } = req.query;

  if (req.config.recaptchaSecretKey) {
    if (!recaptchaToken) {
      res.status(422);
      res.json({
        errors: ["Recaptcha error: it doesn't exist recaptcha token"],
      });
      return;
    }
    try {
      const recaptchaScore = await recaptchaVerify(
        recaptchaToken,
        req.config.recaptchaSecretKey
      );
      if (recaptchaScore < 0.5) {
        res.status(400);
        return res.json({
          errors: [
            `Suspicious behavior detected. Please try again later or contact support.`,
          ],
        });
      }
    } catch (error) {
      res.status(400);
      return res.json({
        errors: [`Recaptcha error: ${error}`],
      });
    }
  }

  const emailValid = validator.validate(email);
  if (!emailValid) {
    res.status(422);
    res.json({ errors: ["invalid email"] });
    return;
  }
  const [hashedPassword, salt] = await hash(password);
  const id = uuid();
  const emailValidToken = uuid();

  // use SendGrid to verify user only if credentials have been provided
  let validUser = true;
  if (req.config.sendgridApiKey && req.config.supportAddr) {
    validUser = false;
  }

  let admin = false;
  const [[oneUser]] = await db.user.find({}, { limit: 1 });
  if (!oneUser) {
    logger.warn("!!!!!!!!!!!!!!!!!!!");
    logger.warn(
      `first user detected, promoting new admin userId=${id} email=${email}`
    );
    logger.warn("!!!!!!!!!!!!!!!!!!!");
    admin = true;
  }

  let stripeFields: Partial<User> = {};
  if (req.stripe) {
    const customer = await getOrCreateCustomer(req.stripe, email);
    const subscription = await getOrCreateSubscription(
      req.stripe,
      defaultProductId,
      customer.id
    );
    stripeFields = {
      stripeCustomerId: customer.id,
      stripeCustomerSubscriptionId: subscription.id,
      stripeProductId: defaultProductId,
    };
  }

  await db.user.create({
    kind: "user",
    id: id,
    createdAt: Date.now(),
    email: email,
    password: hashedPassword,
    salt: salt,
    admin: admin,
    emailValidToken: emailValidToken,
    emailValid: validUser,
    firstName,
    lastName,
    organization,
    phone,
    ...stripeFields,
  });

  const user = cleanUserFields(await db.user.get(id));
  if (!validUser && user) {
    const {
      supportAddr,
      sendgridTemplateId,
      sendgridApiKey,
      sendgridValidationApiKey,
    } = req.config;
    try {
      // This is a test of the Sendgrid email validation API. Remove this
      // if we decide not to use it and revert to more basic Sendgrid plan.
      sendgridValidateEmail(email, sendgridValidationApiKey);
      // send email verification message to user using SendGrid
      await sendgridEmail({
        email,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
        subject: "Verify your Livepeer.com Email",
        preheader: "Welcome to Livepeer.com!",
        buttonText: "Verify Email",
        buttonUrl: frontendUrl(
          req,
          `/verify?${qs.stringify({ email, emailValidToken, selectedPlan })}`
        ),
        unsubscribe: unsubscribeUrl(req),
        text: [
          "Please verify your email address to ensure that you can change your password or receive updates from us.",
        ].join("\n\n"),
      });
    } catch (err) {
      res.status(400);
      return res.json({
        errors: [
          `error sending confirmation email to ${req.body.email}: error: ${err}`,
        ],
      });
    }
  }

  if (!user) {
    res.status(403);
    return res.json({ errors: ["user not created"] });
  }

  res.status(201);
  res.json(user);
});

const suspensionEmailText = (
  emailTemplate: SuspendUserPayload["emailTemplate"]
) => {
  switch (emailTemplate) {
    case "copyright":
      return [
        "We were notified that your stream contained illegal or copyrighted content. We have suspended your account.",
        "Please note that you cannot use Livepeer to stream copyrighted content. Any copyrighted content will be taken down and your account will be suspended.",
      ].join("\n\n");
    default:
      return "Your account has been suspended. Please contact us for more information.";
  }
};

app.patch(
  "/:id/suspended",
  validatePost("suspend-user-payload"),
  authMiddleware({ anyAdmin: true }),
  async (req, res) => {
    const { suspended, emailTemplate } = req.body as SuspendUserPayload;
    const { id } = req.params;
    const user = await db.user.get(id);
    if (!user) {
      return res.status(404).json({ errors: ["not found"] });
    }
    const { email } = user;

    logger.info(`set user ${id} (${email}) suspended ${suspended}`);
    await db.user.update(id, { suspended });

    suspendUserStreams(req, id, suspended).catch((err) => {
      logger.error(
        `error suspending user streams id=${id} email=${email} err=${err}`
      );
    });

    if (suspended) {
      const {
        frontendDomain,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
      } = req.config;
      try {
        await sendgridEmail({
          email,
          bcc: infraEmail,
          supportAddr,
          sendgridTemplateId,
          sendgridApiKey,
          subject: "Account Suspended",
          preheader: `Your ${frontendDomain} account has been suspended.`,
          buttonText: "Appeal Suspension",
          buttonUrl: frontendUrl(req, "/contact"),
          unsubscribe: unsubscribeUrl(req),
          text: suspensionEmailText(emailTemplate),
        });
      } catch (err) {
        logger.error(
          `error sending suspension email to user=${email} err=${err}`
        );
      }
    }

    res.status(204);
    res.end();
  }
);

app.post("/token", validatePost("user"), async (req, res) => {
  const user = await findUserByEmail(req.body.email);
  const [hashedPassword] = await hash(req.body.password, user.salt);
  if (hashedPassword !== user.password) {
    res.status(403);
    res.json({ errors: ["incorrect password"] });
    return;
  }

  if (user.suspended) {
    res.status(403);
    return res.json({ errors: ["user is suspended"] });
  }

  const token = jwt.sign(
    { sub: user.id, aud: req.config.jwtAudience },
    req.config.jwtSecret,
    {
      algorithm: "HS256",
    }
  );
  res.status(201);
  res.json({ id: user.id, email: user.email, token: token });
});

app.post("/verify", validatePost("user-verification"), async (req, res) => {
  let user = await findUserByEmail(req.body.email);
  if (user.emailValidToken === req.body.emailValidToken) {
    // alert sales of new verified user
    const { supportAddr, sendgridTemplateId, sendgridApiKey } = req.config;

    if (req.headers.host.includes("livepeer.com")) {
      try {
        // send sales@livepeer.org user verification message using SendGrid
        await sendgridEmail({
          email: salesEmail,
          supportAddr,
          sendgridTemplateId,
          sendgridApiKey,
          subject: `User ${user.email} signed up with Livepeer!`,
          preheader: "We have a new verified user",
          buttonText: "Log into livepeer",
          buttonUrl: frontendUrl(req, "/login"),
          unsubscribe: unsubscribeUrl(req),
          text: [
            `User ${user.email} has signed up and verified their email with Livepeer!`,
          ].join("\n\n"),
        });
      } catch (err) {
        logger.error(`error sending email to ${salesEmail}: error: ${err}`);
      }
    }

    // return user
    user = { ...user, emailValid: true };
    await db.user.update(user.id, {
      emailValid: true,
      verifiedAt: Date.now(),
    });
    res.status(201);
    res.json({ email: user.email, emailValid: user.emailValid });
  } else {
    res.status(403);
    res.json({ errors: ["incorrect user validation token"] });
  }
});

// resend verify email
app.post("/verify-email", validatePost("verify-email"), async (req, res) => {
  const { selectedPlan } = req.query;
  const user = await findUserByEmail(req.body.email);
  const { emailValid, email, emailValidToken } = user;

  if (emailValid) {
    const {
      supportAddr,
      sendgridTemplateId,
      sendgridApiKey,
      sendgridValidationApiKey,
    } = req.config;

    try {
      sendgridValidateEmail(email, sendgridValidationApiKey);
      await sendgridEmail({
        email,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
        subject: "Verify your Livepeer.com Email",
        preheader: "Welcome to Livepeer.com!",
        buttonText: "Verify Email",
        buttonUrl: frontendUrl(
          req,
          `/verify?${qs.stringify({ email, emailValidToken, selectedPlan })}`
        ),
        unsubscribe: unsubscribeUrl(req),
        text: [
          "Please verify your email address to ensure that you can change your password or receive updates from us.",
        ].join("\n\n"),
      });
    } catch (err) {
      res.status(400);
      return res.json({
        errors: [
          `error sending confirmation email to ${req.body.email}: error: ${err}`,
        ],
      });
    }
  }
  res.status(200).json(cleanUserFields(user));
});

app.post(
  "/password/reset",
  validatePost("password-reset-confirm"),
  async (req, res) => {
    const { email, password, resetToken } = req.body as PasswordResetConfirm;
    let user = await findUserByEmail(email);
    if (!user) {
      res.status(404);
      return res.json({ errors: [`user email ${email} not found`] });
    }

    const [tokens] = await db.passwordResetToken.find({
      userId: user.id,
    });
    if (tokens.length < 1) {
      res.status(404);
      return res.json({ errors: ["Password reset token not found"] });
    }

    const dbResetToken = tokens.find((t) => t.resetToken === resetToken);
    if (!dbResetToken || dbResetToken.expiration < Date.now()) {
      res.status(403);
      return res.json({
        errors: ["incorrect or expired user validation token"],
      });
    }

    // change user password
    const [hashedPassword, salt] = await hash(password);
    await db.user.update(user.id, {
      password: hashedPassword,
      salt,
      emailValid: true,
    });
    // delete all password reset tokens from user
    await Promise.all(tokens.map((t) => db.passwordResetToken.delete(t.id)));

    const userResp = await db.user.get(user.id);
    res.status(200).json(cleanUserFields(userResp));
  }
);

app.post(
  "/password/reset-token",
  validatePost("password-reset-token-request"),
  async (req, res) => {
    const { email } = req.body as PasswordResetTokenRequest;
    let user = await findUserByEmail(email);
    if (!user) {
      res.status(404);
      return res.json({ errors: [`user email ${email} not found`] });
    }

    const id = uuid();
    let resetToken = uuid();
    await db.passwordResetToken.create({
      kind: "password-reset-token",
      id: id,
      userId: user.id,
      resetToken: resetToken,
      expiration: Date.now() + ms("48 hours"),
    });

    const { supportAddr, sendgridTemplateId, sendgridApiKey } = req.config;
    try {
      await sendgridEmail({
        email,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
        subject: "Livepeer Password Reset",
        preheader: "Reset your Livepeer Password!",
        buttonText: "Reset Password",
        buttonUrl: frontendUrl(
          req,
          `/reset-password?${qs.stringify({ email, resetToken })}`
        ),
        unsubscribe: unsubscribeUrl(req),
        text: [
          "Let's change your password so you can log into the Livepeer API.",
          "Your link is active for 48 hours. After that, you will need to resend the password reset email.",
        ].join("\n\n"),
      });
    } catch (err) {
      res.status(400);
      return res.json({
        errors: [`error sending confirmation email to ${email}: error: ${err}`],
      });
    }

    const newToken = db.passwordResetToken.cleanWriteOnlyResponse(
      await db.passwordResetToken.get(id)
    );
    if (newToken) {
      res.status(201);
      res.json(newToken);
    } else {
      res.status(403);
      res.json({ errors: ["error creating password reset token"] });
    }
  }
);

app.post(
  "/make-admin",
  authMiddleware({ admin: true }),
  validatePost("make-admin"),
  async (req, res) => {
    let user = await findUserByEmail(req.body.email);
    await db.user.update(user.id, { admin: req.body.admin });
    user = await db.user.get(user.id);
    res.status(200).json(cleanUserFields(user, req.user.admin));
  }
);

app.post(
  "/create-customer",
  requireStripe(),
  validatePost("create-customer"),
  async (req, res) => {
    const { email } = req.body as CreateCustomer;
    let user = await findUserByEmail(email, false);

    let customer: Stripe.Customer;
    if (user.stripeCustomerId) {
      customer = await req.stripe.customers
        .retrieve(user.stripeCustomerId)
        .then((c) => (c.deleted !== true ? c : null));
    }

    if (!customer) {
      logger.warn(
        `deprecated /create-customer API used. userEmail=${user.email} createdAt=${user.createdAt}`
      );
      customer = await getOrCreateCustomer(req.stripe, email);
      await db.user.update(user.id, {
        stripeCustomerId: customer.id,
      });
      res.status(201);
    }
    res.json(customer);
  }
);

app.post(
  "/update-customer-payment-method",
  authMiddleware({}),
  validatePost("update-customer-payment-method"),
  requireStripe(),
  async (req, res) => {
    const [users] = await db.user.find(
      { stripeCustomerId: req.body.stripeCustomerId },
      { useReplica: false }
    );
    if (users.length < 1 || users[0].id !== req.user.id) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }
    let user = users[0];

    const paymentMethod = await req.stripe.paymentMethods.attach(
      req.body.stripeCustomerPaymentMethodId,
      {
        customer: req.body.stripeCustomerId,
      }
    );

    const customer = await req.stripe.customers.update(
      req.body.stripeCustomerId,
      {
        invoice_settings: {
          default_payment_method: req.body.stripeCustomerPaymentMethodId,
        },
      }
    );

    // Update user's payment method
    await db.user.update(user.id, {
      stripeCustomerPaymentMethodId: req.body.stripeCustomerPaymentMethodId,
      ccLast4: paymentMethod.card.last4,
      ccBrand: paymentMethod.card.brand,
    });
    res.json(customer);
  }
);

app.post(
  "/create-subscription",
  validatePost("create-subscription"),
  requireStripe(),
  async (req, res) => {
    const { stripeCustomerId, stripeProductId, stripeCustomerPaymentMethodId } =
      req.body as CreateSubscription;
    const [users] = await db.user.find(
      { stripeCustomerId: stripeCustomerId },
      { useReplica: false }
    );
    if (users.length < 1) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }
    let user = users[0];
    if (user.stripeCustomerSubscriptionId) {
      const subscription = await req.stripe.subscriptions.retrieve(
        user.stripeCustomerSubscriptionId
      );
      return res.send(subscription);
    }
    logger.warn(
      `deprecated /create-subscription API used. userEmail=${user.email} createdAt=${user.createdAt}`
    );

    // Attach the payment method to the customer if it exists (free plan doesn't require payment)
    if (stripeCustomerPaymentMethodId) {
      logger.warn(
        `attaching payment method through /create-subscription. userEmail=${user.email} createdAt=${user.createdAt}`
      );
      try {
        const paymentMethod = await req.stripe.paymentMethods.attach(
          stripeCustomerPaymentMethodId,
          {
            customer: stripeCustomerId,
          }
        );
        // Update user's payment method
        await db.user.update(user.id, {
          stripeCustomerPaymentMethodId: stripeCustomerPaymentMethodId,
          ccLast4: paymentMethod.card.last4,
          ccBrand: paymentMethod.card.brand,
        });
      } catch (error) {
        return res.status(402).send({ errors: [error.message] });
      }

      // Change the default invoice settings on the customer to the new payment method
      await req.stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: stripeCustomerPaymentMethodId,
        },
      });
    }

    // Create the subscription
    const subscription = await getOrCreateSubscription(
      req.stripe,
      stripeProductId,
      stripeCustomerId
    );

    // Update user's product and subscription id in our db
    await db.user.update(user.id, {
      stripeProductId,
      stripeCustomerSubscriptionId: subscription.id,
    });
    res.send(subscription);
  }
);

app.post(
  "/update-subscription",
  authMiddleware({}),
  validatePost("update-subscription"),
  requireStripe(),
  async (req, res) => {
    const payload = req.body as UpdateSubscription;
    const [users] = await db.user.find(
      { stripeCustomerId: payload.stripeCustomerId },
      { useReplica: false }
    );
    if (
      users.length < 1 ||
      users[0].stripeCustomerId !== payload.stripeCustomerId
    ) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }
    let user = users[0];

    // Attach the payment method to the customer if it exists (free plan doesn't require payment)
    if (payload.stripeCustomerPaymentMethodId) {
      try {
        const paymentMethod = await req.stripe.paymentMethods.attach(
          payload.stripeCustomerPaymentMethodId,
          {
            customer: payload.stripeCustomerId,
          }
        );
        // Update user's payment method in our db
        await db.user.update(user.id, {
          stripeCustomerPaymentMethodId: payload.stripeCustomerPaymentMethodId,
          ccLast4: paymentMethod.card.last4,
          ccBrand: paymentMethod.card.brand,
        });
      } catch (error) {
        return res.status(402).send({ error: { message: error.message } });
      }

      // Change the default invoice settings on the customer to the new payment method
      await req.stripe.customers.update(payload.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: payload.stripeCustomerPaymentMethodId,
        },
      });
    }

    // Get all the prices associated with this plan (just transcoding price as of now)
    const items = await req.stripe.prices.list({
      lookup_keys: products[payload.stripeProductId].lookupKeys,
    });

    // Get the subscription
    const subscription = await req.stripe.subscriptions.retrieve(
      payload.stripeCustomerSubscriptionId
    );

    // Get the prices associated with the subscription
    const subscriptionItems = await req.stripe.subscriptionItems.list({
      subscription: payload.stripeCustomerSubscriptionId,
    });

    // Get the customer's usage
    const usageRes = await db.stream.usage(
      user.id,
      subscription.current_period_start,
      subscription.current_period_end,
      {
        useReplica: false,
      }
    );

    // Update the customer's invoice items based on its usage
    await Promise.all(
      products[user.stripeProductId].usage.map(async (product) => {
        if (product.name === "Transcoding") {
          const durMins = usageRes.sourceSegmentsDuration / 60;
          let quantity = Math.round(parseFloat(durMins.toFixed(2)));
          await req.stripe.invoiceItems.create({
            customer: payload.stripeCustomerId,
            currency: "usd",
            period: {
              start: subscription.current_period_start,
              end: subscription.current_period_end,
            },
            unit_amount_decimal: (product.price * 100).toString(),
            subscription: payload.stripeCustomerSubscriptionId,
            quantity,
            description: product.description,
          });
        }
      })
    );

    // Update the customer's subscription plan.
    // Stripe will automatically invoice the customer based on its usage up until this point
    const updatedSubscription = await req.stripe.subscriptions.update(
      payload.stripeCustomerSubscriptionId,
      {
        billing_cycle_anchor: "now", // reset billing anchor when updating subscription
        items: [
          ...subscriptionItems.data.map((item) => ({
            id: item.id,
            deleted: true,
            clear_usage: true,
            price: item.price.id,
          })),
          ...items.data.map((item) => ({
            price: item.id,
          })),
        ],
      }
    );

    // Update user's product subscription in our db
    await db.user.update(user.id, {
      stripeProductId: payload.stripeProductId,
      planChangedAt: Date.now(),
    });
    res.send(updatedSubscription);
  }
);

app.post(
  "/retrieve-subscription",
  authMiddleware({}),
  requireStripe(),
  async (req, res) => {
    let { stripeCustomerSubscriptionId } = req.body;
    if (
      req.user.stripeCustomerSubscriptionId !== stripeCustomerSubscriptionId
    ) {
      return res.status(403).json({ errors: ["access forbidden"] });
    }
    const subscription = await req.stripe.subscriptions.retrieve(
      stripeCustomerSubscriptionId
    );
    res.status(200).json(subscription);
  }
);

app.post(
  "/retrieve-invoices",
  authMiddleware({}),
  requireStripe(),
  async (req, res) => {
    let { stripeCustomerId } = req.body;
    if (req.user.stripeCustomerId !== stripeCustomerId) {
      return res.status(403).json({ errors: ["access forbidden"] });
    }
    const invoices = await req.stripe.invoices.list({
      customer: stripeCustomerId,
    });
    res.status(200).json(invoices);
  }
);

app.post(
  "/retrieve-payment-method",
  authMiddleware({}),
  requireStripe(),
  async (req, res) => {
    let { stripePaymentMethodId } = req.body;
    if (req.user.stripeCustomerPaymentMethodId !== stripePaymentMethodId) {
      return res.status(403).json({ errors: ["access forbidden"] });
    }
    const paymentMethod = await req.stripe.paymentMethods.retrieve(
      stripePaymentMethodId
    );
    res.status(200).json(paymentMethod);
  }
);

export default app;
