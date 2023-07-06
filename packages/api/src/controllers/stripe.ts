import Router from "express/lib/router";
import { db } from "../store";
import Stripe from "stripe";
import { products } from "../config";
import sql from "sql-template-strings";
import fetch from "node-fetch";
import qs from "qs";
import { sendgridEmailPaymentFailed } from "./helpers";

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

export const reportUsage = async (req, adminToken) => {
  const [users] = await db.user.find(
    [
      sql`users.data->>'stripeProductId' IN ('growth_1', 'scale_1', 'prod_O9XtHhI6rbTT1B','prod_O9XtcfOSMjSD5L')`,
    ],
    {
      limit: 9999999999,
      useReplica: true,
    }
  );

  let updatedUsers = [];
  for (const user of users) {
    const userSubscription = await req.stripe.subscriptions.retrieve(
      user.stripeCustomerSubscriptionId
    );

    const billingCycleStart = 1685311200000; // userSubscription.current_period_start * 1000 // TMP: use a fixed date for now
    const billingCycleEnd = 1687989600000; // userSubscription.current_period_end * 1000) // TMP: use a fixed date for now

    const ingests = await req.getIngest();
    const billingUsage = await getBillingUsage(
      user.id,
      billingCycleStart,
      billingCycleEnd,
      ingests[0].origin,
      adminToken
    );

    const overUsage = await calculateOverUsage(
      products[user.stripeProductId],
      billingUsage
    );

    const subscriptionItems = await req.stripe.subscriptionItems.list({
      subscription: user.stripeCustomerSubscriptionId,
    });

    // create a map of subscription items by their lookup keys
    const subscriptionItemsByLookupKey = subscriptionItems.data.reduce(
      (acc, item) => {
        acc[item.price.lookup_key] = item.id;
        return acc;
      },
      {} as Record<string, string>
    );

    try {
      // Invoice items based on overusage
      await Promise.all(
        products[user.stripeProductId].usage.map(async (product) => {
          if (product.name === "Transcoding") {
            await req.stripe.subscriptionItems.createUsageRecord(
              subscriptionItemsByLookupKey["transcoding_usage"],
              {
                quantity: parseInt(overUsage.TotalUsageMins.toFixed(0)),
                timestamp: Math.floor(new Date().getTime() / 1000),
                action: "set",
              }
            );
          } else if (product.name === "Streaming") {
            await req.stripe.subscriptionItems.createUsageRecord(
              subscriptionItemsByLookupKey["tstreaming_usage"],
              {
                quantity: parseInt(overUsage.DeliveryUsageMins.toFixed(0)),
                timestamp: Math.floor(new Date().getTime() / 1000),
                action: "set",
              }
            );
          } else if (product.name === "Storage") {
            await req.stripe.subscriptionItems.createUsageRecord(
              subscriptionItemsByLookupKey["tstorage_usage"],
              {
                quantity: parseInt(overUsage.StorageUsageMins.toFixed(0)),
                timestamp: Math.floor(new Date().getTime() / 1000),
                action: "set",
              }
            );
          }
        })
      );
      updatedUsers.push({
        id: user.id,
        email: user.email,
        overUsage: overUsage,
        usage: billingUsage,
        usageReported: true,
      });
    } catch (e) {
      console.log(`
        Failed to create usage record for user=${user.id} with error=${e.message} - it's pay as you go subscription probably needs to get migrated
      `);
      updatedUsers.push({
        id: user.id,
        email: user.email,
        overUsage: overUsage,
        usage: billingUsage,
        usageReported: false,
        error: e.message,
      });
    }
  }

  return {
    updatedUsers: updatedUsers,
  };
};

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

const getBillingUsage = async (
  userId,
  fromTime,
  toTime,
  baseUrl,
  adminToken
) => {
  // Fetch usage data from /data/usage endpoint
  const usage = await fetch(
    `${baseUrl}/api/data/usage/query?${qs.stringify({
      from: fromTime,
      to: toTime,
      userId: userId,
    })}`,
    {
      headers: {
        Authorization: `Bearer ${adminToken}`,
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
  } else if (event.type === "invoice.payment_failed") {
    // Notify via email
    const invoice = event.data.object;
    const [users] = await db.user.find(
      { stripeCustomerId: invoice.customer },
      { useReplica: false }
    );

    // notify help@livepeer.org
    await sendgridEmailPaymentFailed({
      email: "help@livepeer.org",
      sendgridApiKey: req.config.sendgridApiKey,
      userId: users[0].id,
      invoiceId: invoice.id,
    });
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
