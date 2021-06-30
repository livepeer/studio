import { authMiddleware } from "../middleware";
import { validatePost } from "../middleware";
import Router from "express/lib/router";
import uuid from "uuid/v4";
import ms from "ms";
import jwt from "jsonwebtoken";
import validator from "email-validator";
import {
  makeNextHREF,
  sendgridEmail,
  trackAction,
  parseFilters,
  parseOrder,
} from "./helpers";
import logger from "../logger";
import hash from "../hash";
import qs from "qs";
import { db } from "../store";
import { products } from "../config";
import sql from "sql-template-strings";

const stripe = require("stripe")(process.env.LP_STRIPE_SECRET_KEY);
const app = Router();

app.get("/usage", authMiddleware({}), async (req, res) => {
  let { userId, fromTime, toTime } = req.query;
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
  email: `data->>'email'`,
  emailValid: { val: `data->'emailValid'`, type: "boolean" },
  admin: { val: `data->'admin'`, type: "boolean" },
  stripeProductId: `data->>'stripeProductId'`,
};

app.get("/", authMiddleware({ admin: true }), async (req, res) => {
  let { limit, cursor, order, filters } = req.query;
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

const adminOnlyFields = ["verifiedAt", "planChangedAt"];
function cleanAdminOnlyFields(aof, obj) {
  for (const f of aof) {
    delete obj[f];
  }
}

app.get("/:id", authMiddleware({ allowUnverified: true }), async (req, res) => {
  const user = await req.store.get(`user/${req.params.id}`);
  if (req.user.admin !== true && req.user.id !== req.params.id) {
    res.status(403);
    res.json({
      errors: ["user can only request information on their own user object"],
    });
  } else {
    if (!req.user.admin) {
      cleanAdminOnlyFields(adminOnlyFields, user);
    }
    res.status(200);
    res.json(user);
  }
});

app.post("/", validatePost("user"), async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    organization,
    phone,
  } = req.body;
  const { selectedPlan } = req.query;
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
    req.store.create({
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

  const user = await req.store.get(`user/${id}`);

  const protocol =
    req.headers["x-forwarded-proto"] === "https" ? "https" : "http";

  const verificationUrl = `${protocol}://${
    req.frontendDomain
  }/app/user/verify?${qs.stringify({ email, emailValidToken, selectedPlan })}`;
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
        subject: "Verify your Livepeer Email",
        preheader: "Welcome to Livepeer!",
        buttonText: "Verify Email",
        buttonUrl: verificationUrl,
        unsubscribe: unsubscribeUrl,
        text: [
          "Let's verify your email so you can start using the Livepeer API.",
          "Your link is active for 48 hours. After that, you will need to resend the verification email.",
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
  const { data: userIds } = await req.store.query({
    kind: "user",
    query: { email: req.body.email },
  });

  if (userIds.length < 1) {
    res.status(404);
    return res.json({ errors: ["user not found"] });
  }
  const user = await req.store.get(`user/${userIds[0]}`, false);
  if (!user) {
    res.status(404);
    return res.json({ errors: ["user not found"] });
  }

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
  const { data: userIds } = await req.store.query({
    kind: "user",
    query: { email: req.body.email },
  });
  if (userIds.length < 1) {
    res.status(404);
    return res.json({ errors: ["user not found"] });
  }

  let user = await req.store.get(`user/${userIds[0]}`, false);
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
  validatePost("password-reset"),
  async (req, res) => {
    const { email, password, resetToken } = req.body;
    const {
      data: [userId],
    } = await req.store.query({
      kind: "user",
      query: { email: email },
    });
    if (!userId) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }

    let user = await req.store.get(`user/${userId}`);
    if (!user) {
      res.status(404);
      return res.json({ errors: [`user email ${email} not found`] });
    }

    const { data: tokens } = await req.store.query({
      kind: "password-reset-token",
      query: {
        userId: user.id,
      },
    });

    if (tokens.length < 1) {
      res.status(404);
      return res.json({ errors: ["Password reset token not found"] });
    }

    let dbResetToken;
    for (let i = 0; i < tokens.length; i++) {
      const token = await req.store.get(
        `password-reset-token/${tokens[i]}`,
        false
      );

      if (token.resetToken === resetToken) {
        dbResetToken = token;
      }
    }

    if (!dbResetToken || dbResetToken.expiration < Date.now()) {
      res.status(403);
      return res.json({
        errors: ["incorrect or expired user validation token"],
      });
    }

    // change user password
    const [hashedPassword, salt] = await hash(password);
    await req.store.replace({
      ...user,
      password: hashedPassword,
      salt: salt,
      emailValid: true,
    });

    user = await req.store.get(`user/${userId}`);

    // delete all reset tokens associated with user
    for (const t of tokens) {
      await req.store.delete(`password-reset-token/${t}`);
    }

    res.status(201);
    return res.json(user);
  }
);

app.post(
  "/password/reset-token",
  validatePost("password-reset-token"),
  async (req, res) => {
    const email = req.body.email;
    const {
      data: [userId],
    } = await req.store.query({
      kind: "user",
      query: { email: email },
    });
    if (!userId) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }

    let user = await req.store.get(`user/${userId}`);
    if (!user) {
      res.status(404);
      return res.json({ errors: [`user email ${email} not found`] });
    }

    const id = uuid();
    let resetToken = uuid();
    await req.store.create({
      kind: "password-reset-token",
      id: id,
      userId: userId,
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

    const newToken = await req.store.get(`password-reset-token/${id}`, false);

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
    const { data: userIds } = await req.store.query({
      kind: "user",
      query: { email: req.body.email },
    });
    if (userIds.length < 1) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }

    let user = await req.store.get(`user/${userIds[0]}`, false);
    if (user) {
      user = { ...user, admin: req.body.admin };
      await req.store.replace(user);
      res.status(201);
      res.json({ email: user.email, admin: user.admin });
    } else {
      res.status(403);
      res.json({ errors: ["user not made an admin"] });
    }
  }
);

app.post(
  "/create-customer",
  validatePost("create-customer"),
  async (req, res) => {
    const [users] = await db.user.find(
      { email: req.body.email },
      { useReplica: false }
    );
    if (users.length < 1) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }

    let user = users[0];
    const customer = await stripe.customers.create({
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

    const paymentMethod = await stripe.paymentMethods.attach(
      req.body.stripeCustomerPaymentMethodId,
      {
        customer: req.body.stripeCustomerId,
      }
    );

    const customer = await stripe.customers.update(req.body.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: req.body.stripeCustomerPaymentMethodId,
      },
    });

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
    const [users] = await db.user.find(
      { stripeCustomerId: req.body.stripeCustomerId },
      { useReplica: false }
    );
    if (users.length < 1) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }

    let user = users[0];

    // Attach the payment method to the customer if it exists (free plan doesn't require payment)
    if (req.body.stripeCustomerPaymentMethodId) {
      try {
        const paymentMethod = await stripe.paymentMethods.attach(
          req.body.stripeCustomerPaymentMethodId,
          {
            customer: req.body.stripeCustomerId,
          }
        );
        // Update user's payment method
        await db.user.update(user.id, {
          stripeCustomerPaymentMethodId: req.body.stripeCustomerPaymentMethodId,
          ccLast4: paymentMethod.card.last4,
          ccBrand: paymentMethod.card.brand,
        });
      } catch (error) {
        return res.status("402").send({ error: { message: error.message } });
      }

      // Change the default invoice settings on the customer to the new payment method
      await stripe.customers.update(req.body.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: req.body.stripeCustomerPaymentMethodId,
        },
      });
    }

    // fetch prices associated with plan
    const items = await stripe.prices.list({
      lookup_keys: products[req.body.stripeProductId].lookupKeys,
    });

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      cancel_at_period_end: false,
      customer: req.body.stripeCustomerId,
      items: items.data.map((item) => ({ price: item.id })),
      expand: ["latest_invoice.payment_intent"],
    });

    // Update user's product and subscription id in our db
    await db.user.update(user.id, {
      stripeProductId: req.body.stripeProductId,
      stripeCustomerSubscriptionId: subscription.id,
    });
    res.send(subscription);
  }
);

app.post(
  "/update-subscription",
  validatePost("update-subscription"),
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

    // Attach the payment method to the customer if it exists (free plan doesn't require payment)
    if (req.body.stripeCustomerPaymentMethodId) {
      try {
        const paymentMethod = await stripe.paymentMethods.attach(
          req.body.stripeCustomerPaymentMethodId,
          {
            customer: req.body.stripeCustomerId,
          }
        );
        // Update user's payment method in our db
        await db.user.update(user.id, {
          stripeCustomerPaymentMethodId: req.body.stripeCustomerPaymentMethodId,
          ccLast4: paymentMethod.card.last4,
          ccBrand: paymentMethod.card.brand,
        });
      } catch (error) {
        return res.status("402").send({ error: { message: error.message } });
      }

      // Change the default invoice settings on the customer to the new payment method
      await stripe.customers.update(req.body.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: req.body.stripeCustomerPaymentMethodId,
        },
      });
    }

    // Get all the prices associated with this plan (just transcoding price as of now)
    const items = await stripe.prices.list({
      lookup_keys: products[req.body.stripeProductId].lookupKeys,
    });

    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(
      req.body.stripeCustomerSubscriptionId
    );

    // Get the prices associated with the subscription
    const subscriptionItems = await stripe.subscriptionItems.list({
      subscription: req.body.stripeCustomerSubscriptionId,
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
          let quantity = Math.round(
            (usageRes.sourceSegmentsDuration / 60).toFixed(2)
          );
          await stripe.invoiceItems.create({
            customer: req.body.stripeCustomerId,
            currency: "usd",
            period: {
              start: subscription.current_period_start,
              end: subscription.current_period_end,
            },
            unit_amount_decimal: product.price * 100,
            subscription: req.body.stripeCustomerSubscriptionId,
            quantity,
            description: product.description,
          });
        }
      })
    );

    // Update the customer's subscription plan.
    // Stripe will automatically invoice the customer based on its usage up until this point
    const updatedSubscription = await stripe.subscriptions.update(
      req.body.stripeCustomerSubscriptionId,
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
      stripeProductId: req.body.stripeProductId,
      planChangedAt: Date.now(),
    });
    res.send(updatedSubscription);
  }
);

app.post("/retrieve-subscription", async (req, res) => {
  let { stripeCustomerSubscriptionId } = req.body;
  const subscription = await stripe.subscriptions.retrieve(
    stripeCustomerSubscriptionId
  );
  res.status(200);
  res.json(subscription);
});

app.post("/retrieve-invoices", async (req, res) => {
  let { stripeCustomerId } = req.body;
  const invoices = await stripe.invoices.list({
    customer: stripeCustomerId,
  });
  res.status(200);
  res.json(invoices);
});

app.post("/retrieve-payment-method", async (req, res) => {
  let { stripePaymentMethodId } = req.body;
  const paymentMethod = await stripe.paymentMethods.retrieve(
    stripePaymentMethodId
  );
  res.status(200);
  res.json(paymentMethod);
});

export default app;
