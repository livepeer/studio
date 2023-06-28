import Router from "express/lib/router";
import { db } from "../store";
import Stripe from "stripe";
import { products } from "../config";
import sql from "sql-template-strings";
import fetch from "node-fetch";
import qs from "qs";

const app = Router();

interface OverUsageBill {
  transcodingBill: OverUsageItem;
  deliveryBill: OverUsageItem;
  storageBill: OverUsageItem;
}

interface OverUsageItem {
  units: number;
  total: number;
}

interface BillingUsageData {
  DeliveryUsageMins: number;
  TotalUsageMins: number;
  StorageUsageMins: number;
}

const testProducts = ["hacker_1", "growth_1", "scale_1"];

const productMapping = {
  hacker_1: "prod_O9XuIjn7EqYRVW",
  growth_1: "prod_O9XtHhI6rbTT1B",
  scale_1: "prod_O9XtcfOSMjSD5L",
};

const payAsYouGoPlans = [
  "prod_O9XtHhI6rbTT1B",
  "prod_O9XtcfOSMjSD5L",
  "growth_1",
  "scale_1",
];

const calculateOverUsage = async (product, usage) => {
  const limits = {
    transcoding: product?.usage[0].limit,
    streaming: product?.usage[1].limit,
    storage: product?.usage[2].limit,
  };

  const overUsage = {
    TotalUsageMins: Math.max(usage?.TotalUsageMins - limits.transcoding, 0),
    DeliveryUsageMins: Math.max(usage?.DeliveryUsageMins - limits.streaming, 0),
    StorageUsageMins: Math.max(usage?.StorageUsageMins - limits.storage, 0),
  };

  return overUsage;
};

const getBillingUsage = async (userId, fromTime, toTime) => {
  const api_token = await db.apiToken.find({ userId });

  // Fetch usage data from /data/usage endpoint
  const usage = await fetch(
    `/data/usage/query?${qs.stringify({
      from: fromTime,
      to: toTime,
    })}`,
    {
      headers: {
        Authorization: `Bearer ${api_token}`,
      },
    }
  ).then((res) => res.json());

  return usage;
};

// Webhook handler for asynchronous events.
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const secret = req.config.stripeWebhookSecret;
    event = req.stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "invoice.created") {
    let invoice = event.data.object;

    if (invoice.status !== "draft") {
      // we don't need to do anything
      return res.sendStatus(200);
    }

    const [users] = await db.user.find(
      { stripeCustomerId: invoice.customer },
      { useReplica: false }
    );

    if (users.length < 1) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }

    const user = users[0];

    if (payAsYouGoPlans.includes(user.stripeProductId)) {
      let usage = await getBillingUsage(
        user.id,
        1685311200000, //invoice.period_start, // TMP Fixed billing cycle to test usage
        1687989600000 //invoice.period_end // TMP Fixed billing cycle to test usage
      );
      let overUsage = await calculateOverUsage(user.stripeProductId, usage);

      const subscriptionItems = await req.stripe.subscriptionItems.list({
        subscription: user.stripeCustomerSubscriptionId,
      });

      // Invoice items based on overusage
      await Promise.all(
        products[user.stripeProductId].usage.map(async (product) => {
          if (product.name === "Transcoding") {
            await req.stripe.subscriptionItems.createUsageRecord(
              subscriptionItems[0],
              {
                quantity: overUsage.TotalUsageMins,
                timestamp: new Date().getTime() / 1000,
                action: "set",
              }
            );
          } else if (product.name === "Streaming") {
            await req.stripe.subscriptionItems.createUsageRecord(
              subscriptionItems[0],
              {
                quantity: overUsage.DeliveryUsageMins,
                timestamp: new Date().getTime() / 1000,
                action: "set",
              }
            );
          } else if (product.name === "Storage") {
            await req.stripe.subscriptionItems.createUsageRecord(
              subscriptionItems[0],
              {
                quantity: overUsage.StorageUsageMins,
                timestamp: new Date().getTime() / 1000,
                action: "set",
              }
            );
          }
        })
      );
      return res.sendStatus(200);
    }

    const usageRes = await db.stream.usage(
      user.id,
      invoice.period_start,
      invoice.period_end,
      {
        useReplica: false,
      }
    );

    // Invoice items based on usage
    await Promise.all(
      products[user.stripeProductId].usage.map(async (product) => {
        if (product.name === "Transcoding") {
          let quantity = Math.round(usageRes.sourceSegmentsDuration / 60);
          await req.stripe.invoiceItems.create({
            customer: user.stripeCustomerId,
            invoice: invoice.id,
            currency: "usd",
            period: {
              start: invoice.period_start,
              end: invoice.period_end,
            },
            subscription: user.stripeCustomerSubscriptionId,
            unit_amount_decimal: product.price * 100,
            quantity,
            description: product.description,
          });
        }
      })
    );
  }

  // Return a response to acknowledge receipt of the event
  return res.sendStatus(200);
});

async function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

// Migrate existing users to stripe
app.post("/migrate-users-to-stripe", async (req, res) => {
  if (req.config.stripeSecretKey != req.body.stripeSecretKey) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }

  const [users] = await db.user.find(
    [sql`users.data->>'stripeCustomerId' IS NULL`],
    {
      limit: 9999999999,
      useReplica: false,
    }
  );

  for (let index = 0; index < users.length; index++) {
    let user = users[index];

    const { data } = await req.stripe.customers.list({
      email: user.email,
    });

    if (data.length === 0) {
      // create the stripe customer
      const customer = await req.stripe.customers.create({
        email: user.email,
      });

      // fetch prices associated with free plan
      const items = await req.stripe.prices.list({
        lookup_keys: products["prod_0"].lookupKeys,
      });

      // Subscribe the user to the free plan
      const subscription = await req.stripe.subscriptions.create({
        cancel_at_period_end: false,
        customer: customer.id,
        items: items.data.map((item) => ({ price: item.id })),
      });

      // Update user's customer, product, subscription, and payment id in our db
      await db.user.update(user.id, {
        stripeCustomerId: customer.id,
        stripeProductId: "prod_0",
        stripeCustomerSubscriptionId: subscription.id,
        stripeCustomerPaymentMethodId: null,
      });

      // sleep for a 200 ms to get around stripe rate limits
      await sleep(200);
    }
  }

  res.json(users);
});

// Migrate personal users to hacker
app.post("/migrate-personal-users", async (req, res) => {
  if (req.config.stripeSecretKey != req.body.stripeSecretKey) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }

  const [users] = await db.user.find(
    [sql`users.data->>'stripeCustomerId' IS NOT NULL`],
    {
      limit: 9999999999,
      useReplica: false,
    }
  );

  for (let index = 0; index < users.length; index++) {
    let user = users[index];

    const { data } = await req.stripe.customers.list({
      email: user.email,
    });

    if (data.length > 0) {
      if (user.stripeProductId === "prod_0") {
        // get the stripe customer
        const customer = await req.stripe.customers.get({
          email: user.email,
        });

        // fetch prices associated with hacker plan
        const items = await req.stripe.prices.list({
          lookup_keys: products["prod_O9XuIjn7EqYRVW"].lookupKeys,
        });

        // Subscribe the user to the hacker plan
        const subscription = await req.stripe.subscriptions.update({
          cancel_at_period_end: false,
          customer: customer.id,
          items: items.data.map((item) => ({ price: item.id })),
        });

        // Update user's customer, product, subscription, and payment id in our db
        await db.user.update(user.id, {
          stripeCustomerId: customer.id,
          stripeProductId: "prod_O9XuIjn7EqYRVW",
          stripeCustomerSubscriptionId: subscription.id,
          stripeCustomerPaymentMethodId: null,
        });

        // sleep for a 200 ms to get around stripe rate limits
        await sleep(200);
      }
    }
  }

  res.json(users);
});

// Migrate test products for each user on stripe
app.post("/migrate-test-products", async (req, res) => {
  if (req.config.stripeSecretKey != req.body.stripeSecretKey) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }

  const [users] = await db.user.find(
    [sql`users.data->>'stripeCustomerId' IS NOT NULL`],
    {
      limit: 9999999999,
      useReplica: false,
    }
  );

  for (let index = 0; index < users.length; index++) {
    let user = users[index];

    // If user.newStripeProductId is in testProducts, migrate it to the new product
    if (testProducts.includes(user.newStripeProductId)) {
      // get the stripe customer
      const customer = await req.stripe.customers.get({
        email: user.email,
      });

      // fetch prices associated with new product
      const items = await req.stripe.prices.list({
        lookup_keys:
          products[productMapping[user.newStripeProductId]].lookupKeys,
      });

      // Subscribe the user to the new product
      const subscription = await req.stripe.subscriptions.update({
        cancel_at_period_end: false,
        customer: customer.id,
        items: items.data.map((item) => ({ price: item.id })),
      });

      // Update user's customer, product, subscription, and payment id in our db
      await db.user.update(user.id, {
        stripeCustomerId: customer.id,
        stripeProductId: productMapping[user.newStripeProductId],
        stripeCustomerSubscriptionId: subscription.id,
        stripeCustomerPaymentMethodId: null,
      });

      // sleep for a 200 ms to get around stripe rate limits
      await sleep(200);

      // Update user's newStripeProductId to null
      await db.user.update(user.id, {
        newStripeProductId: null,
      });
    }
  }

  res.json(users);
});

export default app;
