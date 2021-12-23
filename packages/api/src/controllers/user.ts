import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import { Router } from "express";
import { v4 as uuid } from "uuid";
import ms from "ms";
import jwt from "jsonwebtoken";
import validator from "email-validator";
import {
  makeNextHREF,
  sendgridEmail,
  trackAction,
  parseFilters,
  parseOrder,
  recaptchaVerify,
} from "./helpers";
import logger from "../logger";
import hash from "../hash";
import qs from "qs";
import { db } from "../store";
import { products } from "../config";
import {
  CreateSubscription,
  PasswordResetTokenRequest,
  PasswordResetConfirm,
  UpdateSubscription,
} from "../schema/types";
import { InternalServerError, NotFoundError } from "../store/errors";

function toStringValues(obj: Record<string, any>) {
  const strObj: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    strObj[key] = value.toString();
  }
  return strObj;
}

const adminOnlyFields = ["verifiedAt", "planChangedAt"];

function cleanAdminOnlyFields(fields: string[], obj: Record<string, any>) {
  for (const f of fields) {
    delete obj[f];
  }
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

const fieldsMap = {
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

app.get("/:id", authMiddleware({ allowUnverified: true }), async (req, res) => {
  if (req.user.admin !== true && req.user.id !== req.params.id) {
    return res.status(403).json({
      errors: ["user can only request information on their own user object"],
    });
  }
  const user = db.user.cleanWriteOnlyResponse(await db.user.get(req.params.id));
  if (!req.user.admin) {
    cleanAdminOnlyFields(adminOnlyFields, user);
  }
  res.status(200);
  res.json(user);
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

  await Promise.all([
    db.user.create({
      kind: "user",
      id: id,
      password: hashedPassword,
      email: email,
      salt: salt,
      admin: admin,
      emailValidToken: emailValidToken,
      emailValid: validUser,
      firstName,
      lastName,
      organization,
      phone,
      createdAt: Date.now(),
    }),
    trackAction(
      id,
      email,
      { name: "user registered" },
      req.config.segmentApiKey
    ),
  ]);

  const user = db.user.cleanWriteOnlyResponse(await db.user.get(id));

  const protocol =
    req.headers["x-forwarded-proto"] === "https" ? "https" : "http";

  const verificationUrl = `${protocol}://${
    req.frontendDomain
  }/verify?${qs.stringify({ email, emailValidToken, selectedPlan })}`;
  const unsubscribeUrl = `${protocol}://${req.frontendDomain}/#contactSection`;

  if (!validUser && user) {
    const { supportAddr, sendgridTemplateId, sendgridApiKey } = req.config;
    try {
      // send email verification message to user using SendGrid
      await sendgridEmail({
        email,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
        subject: "Verify your Livepeer.com Email",
        preheader: "Welcome to Livepeer.com!",
        buttonText: "Verify Email",
        buttonUrl: verificationUrl,
        unsubscribe: unsubscribeUrl,
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

app.patch(
  "/:id/suspended",
  authMiddleware({ admin: true }),
  async (req, res) => {
    const { id } = req.params;
    const user = await db.user.get(id);
    if (!user) {
      res.status(404);
      return res.json({ errors: ["not found"] });
    }
    if (req.body.suspended === undefined) {
      res.status(400);
      return res.json({ errors: ["suspended field required"] });
    }
    logger.info(
      `set user ${id} (${user.email}) suspended ${req.body.suspended}`
    );

    await db.user.update(id, { suspended: !!req.body.suspended });

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
    const protocol =
      req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const buttonUrl = `${protocol}://${req.frontendDomain}/login`;
    const unsubscribeUrl = `${protocol}://${req.frontendDomain}/#contactSection`;
    const salesEmail = "sales@livepeer.org";

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
          buttonUrl: buttonUrl,
          unsubscribe: unsubscribeUrl,
          text: [
            `User ${user.email} has signed up and verified their email with Livepeer!`,
          ].join("\n\n"),
        });
      } catch (err) {
        console.error(`error sending email to ${salesEmail}: error: ${err}`);
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

    const userResp = db.user.cleanWriteOnlyResponse(await db.user.get(user.id));
    return res.status(200).json(userResp);
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
      const protocol =
        req.headers["x-forwarded-proto"] === "https" ? "https" : "http";

      const verificationUrl = `${protocol}://${
        req.frontendDomain
      }/reset-password?${qs.stringify({ email, resetToken })}`;
      const unsubscribeUrl = `${protocol}://${req.frontendDomain}/#contactSection`;

      await sendgridEmail({
        email,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
        subject: "Livepeer Password Reset",
        preheader: "Reset your Livepeer Password!",
        buttonText: "Reset Password",
        buttonUrl: verificationUrl,
        unsubscribe: unsubscribeUrl,
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
    res.status(200).json({ email: user.email, admin: user.admin });
  }
);

app.post(
  "/create-customer",
  validatePost("create-customer"),
  async (req, res) => {
    let user = await findUserByEmail(req.body.email, false);
    const customer = await req.stripe.customers.create({
      email: req.body.email,
    });
    await db.user.update(user.id, {
      stripeCustomerId: customer.id,
    });
    res.status(201);
    res.json(customer);
  }
);

app.post(
  "/update-customer-payment-method",
  validatePost("update-customer-payment-method"),
  async (req, res) => {
    const [users] = await db.user.find(
      { stripeCustomerId: req.body.stripeCustomerId },
      { useReplica: false }
    );
    if (users.length < 1) {
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
  async (req, res) => {
    const payload = req.body as CreateSubscription;
    const [users] = await db.user.find(
      { stripeCustomerId: payload.stripeCustomerId },
      { useReplica: false }
    );
    if (users.length < 1) {
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
        // Update user's payment method
        await db.user.update(user.id, {
          stripeCustomerPaymentMethodId: payload.stripeCustomerPaymentMethodId,
          ccLast4: paymentMethod.card.last4,
          ccBrand: paymentMethod.card.brand,
        });
      } catch (error) {
        return res.status(402).send({ errors: [error.message] });
      }

      // Change the default invoice settings on the customer to the new payment method
      await req.stripe.customers.update(payload.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: payload.stripeCustomerPaymentMethodId,
        },
      });
    }

    // fetch prices associated with plan
    const items = await req.stripe.prices.list({
      lookup_keys: products[payload.stripeProductId].lookupKeys,
    });

    // Create the subscription
    const subscription = await req.stripe.subscriptions.create({
      cancel_at_period_end: false,
      customer: payload.stripeCustomerId,
      items: items.data.map((item) => ({ price: item.id })),
      expand: ["latest_invoice.payment_intent"],
    });

    // Update user's product and subscription id in our db
    await db.user.update(user.id, {
      stripeProductId: payload.stripeProductId,
      stripeCustomerSubscriptionId: subscription.id,
    });
    res.send(subscription);
  }
);

app.post(
  "/update-subscription",
  validatePost("update-subscription"),
  async (req, res) => {
    const payload = req.body as UpdateSubscription;
    const [users] = await db.user.find(
      { stripeCustomerId: payload.stripeCustomerId },
      { useReplica: false }
    );
    if (users.length < 1) {
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

app.post("/retrieve-subscription", async (req, res) => {
  let { stripeCustomerSubscriptionId } = req.body;
  const subscription = await req.stripe.subscriptions.retrieve(
    stripeCustomerSubscriptionId
  );
  res.status(200);
  res.json(subscription);
});

app.post("/retrieve-invoices", async (req, res) => {
  let { stripeCustomerId } = req.body;
  const invoices = await req.stripe.invoices.list({
    customer: stripeCustomerId,
  });
  res.status(200);
  res.json(invoices);
});

app.post("/retrieve-payment-method", async (req, res) => {
  let { stripePaymentMethodId } = req.body;
  const paymentMethod = await req.stripe.paymentMethods.retrieve(
    stripePaymentMethodId
  );
  res.status(200);
  res.json(paymentMethod);
});

export default app;
