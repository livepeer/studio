import Router from "express/lib/router";
import { db } from "../store";
import Stripe from "stripe";
import { products } from "../config";
import sql from "sql-template-strings";
import fetch from "node-fetch";
import qs from "qs";
import { sendgridEmailPaymentFailed } from "./helpers";

const app = Router();

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

  // This is for old users who are on the pro plan
  // They are on the hacker plan after migration, with pay as you go enabled
  // We need to report usage for them as well
  const [oldProPlanUsers] = await db.user.find(
    [
      sql`users.data->>'oldProPlan' = true AND users.data->>'stripeProductId' IN ('hacker_1','prod_O9XuIjn7EqYRVW')`,
    ],
    {
      limit: 9999999999,
      useReplica: true,
    }
  );

  const payAsYouGoUsers = [...users, ...oldProPlanUsers];

  let updatedUsers = [];
  for (const user of payAsYouGoUsers) {
    try {
      let userUpdated = await reportUsageForUser(req, user, adminToken);
      updatedUsers.push(userUpdated);
    } catch (e) {
      console.log(`
        Failed to create usage record for user=${user.id} with error=${e.message} - it's pay as you go subscription probably needs to get migrated
      `);
      updatedUsers.push({
        id: user.id,
        email: user.email,
        usageReported: false,
        error: e.message,
      });
    }
  }

  return {
    updatedUsers: updatedUsers,
  };
};

async function reportUsageForUser(req, user, adminToken) {
  const userSubscription = await req.stripe.subscriptions.retrieve(
    user.stripeCustomerSubscriptionId
  );

  const billingCycleStart = userSubscription.current_period_start * 1000; // 1685311200000 // Test date
  const billingCycleEnd = userSubscription.current_period_end * 1000; // 1687989600000 // Test date

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
      } else if (product.name === "Delivery") {
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
  return {
    id: user.id,
    email: user.email,
    overUsage: overUsage,
    usage: billingUsage,
    usageReported: true,
  };
}

const calculateOverUsage = async (product, usage) => {
  let limits: any = {};

  if (product?.usage) {
    product.usage.forEach((item) => {
      if (item.name.toLowerCase() === "transcoding")
        limits.transcoding = item.limit;
      if (item.name.toLowerCase() === "delivery") limits.streaming = item.limit;
      if (item.name.toLowerCase() === "storage") limits.storage = item.limit;
    });
  }

  const overUsage = {
    TotalUsageMins: Math.max(
      usage?.TotalUsageMins - (limits.transcoding || 0),
      0
    ),
    DeliveryUsageMins: Math.max(
      usage?.DeliveryUsageMins - (limits.streaming || 0),
      0
    ),
    StorageUsageMins: Math.max(
      usage?.StorageUsageMins - (limits.storage || 0),
      0
    ),
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

// Webhook handler for asynchronous events called by stripe on invoice generation
// https://stripe.com/docs/billing/subscriptions/webhooks
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

app.post("/migrate-personal-user", async (req, res) => {
  if (req.config.stripeSecretKey != req.body.stripeSecretKey) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }
  let migration = [];

  const [users] = await db.user.find(
    [
      sql`users.data->>'stripeProductId' = 'prod_0' AND (users.data->>'isActiveSubscription' = 'true' OR users.data->>'isActiveSubscription' IS NULL)`,
    ],
    {
      limit: 1,
      useReplica: false,
    }
  );

  if (users.length == 0) {
    res.json({
      errors: ["no users found"],
    });
    return;
  }

  migration.push(`Found ${users.length} users to migrate`);

  let user = users[0];

  migration.push(`Migrating user ${user.email}`);

  const { data } = await req.stripe.customers.list({
    email: user.email,
  });

  if (data.length > 0) {
    if (
      user.stripeProductId === "prod_0" &&
      user.newStripeProductId !== "growth_1" &&
      user.newStripeProductId !== "scale_1"
    ) {
      migration.push(
        `User ${user.email} is migrating from ${user.stripeProductId} to ${user.newStripeProductId}`
      );
      const items = await req.stripe.prices.list({
        lookup_keys: products["prod_O9XuIjn7EqYRVW"].lookupKeys,
      });
      let subscription;

      try {
        subscription = await req.stripe.subscriptions.retrieve(
          user.stripeCustomerSubscriptionId
        );
        migration.push(
          `User ${user.email} subscription is ${subscription.status}`
        );
      } catch (e) {
        console.log(`
              Unable to migrate personal user - subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}
            `);
        await db.user.update(user.id, {
          isActiveSubscription: false,
        });
        res.json({
          errors: [
            `Unable to migrate personal user - subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
          ],
        });
        return;
      }

      if (subscription.status != "active") {
        console.log(`
              Unable to migrate personal user - user=${user.id} has a status=${subscription.status} subscription
            `);
        await db.user.update(user.id, {
          isActiveSubscription: false,
        });
        res.json({
          errors: [
            `Unable to migrate personal user - user=${user.id} has a status=${subscription.status} subscription`,
          ],
        });
        return;
      }

      try {
        const subscriptionItems = await req.stripe.subscriptionItems.list({
          subscription: user.stripeCustomerSubscriptionId,
        });

        migration.push(
          `User ${user.email} has ${subscriptionItems.data.length} subscription items`
        );

        subscription = await req.stripe.subscriptions.update(
          user.stripeCustomerSubscriptionId,
          {
            billing_cycle_anchor: "now",
            cancel_at_period_end: false,
            items: [
              ...subscriptionItems.data.map((item) => {
                // Check if the item is metered
                const isMetered = item.price.recurring.usage_type === "metered";
                return {
                  id: item.id,
                  deleted: true,
                  clear_usage: isMetered ? true : undefined, // If metered, clear usage
                  price: item.price.id,
                };
              }),
              ...items.data.map((item) => ({
                price: item.id,
              })),
            ],
          }
        );

        migration.push(
          `User ${user.email} has been updated to ${subscription.id}`
        );

        await db.user.update(user.id, {
          stripeCustomerId: user.stripeCustomerId,
          stripeProductId: "prod_O9XuIjn7EqYRVW",
          stripeCustomerSubscriptionId: subscription.id,
        });

        migration.push(`User ${user.email} has been updated in the database`);
      } catch (e) {
        console.log(`
              Unable to migrate personal user - cannot update the user subscription or update the user data user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}
            `);
        res.json({
          errors: [
            `Unable to migrate personal user - cannot update the user subscription or update the user data user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
          ],
        });
        return;
      }
    }
  } else {
    res.json({
      errors: [
        `Unable to migrate personal user - customer not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
      ],
    });
    await db.user.update(user.id, {
      isActiveSubscription: false,
    });
    return;
  }
  migration.push(
    `User ${user.email} has been migrated to ${user.newStripeProductId}`
  );
  res.json({
    result: "Migrated user with email " + user.email + " to hacker plan",
    migration: migration,
  });
});

app.post("/migrate-hacker-user", async (req, res) => {
  if (req.config.stripeSecretKey != req.body.stripeSecretKey) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }

  const [users] = await db.user.find(
    [
      sql`users.data->>'stripeProductId' = 'prod_O9XuIjn7EqYRVW' AND (users.data->>'isActiveSubscription' = 'true' OR users.data->>'isActiveSubscription' IS NULL)`,
    ],
    {
      limit: 1,
      useReplica: false,
    }
  );

  if (users.length == 0) {
    res.json({
      errors: ["no users found"],
    });
    return;
  }

  let user = users[0];

  const { data } = await req.stripe.customers.list({
    email: user.email,
  });

  if (data.length > 0) {
    if (user.stripeProductId === "prod_O9XuIjn7EqYRVW") {
      const items = await req.stripe.prices.list({
        lookup_keys: products["prod_0"].lookupKeys,
      });
      let subscription;

      try {
        subscription = await req.stripe.subscriptions.retrieve(
          user.stripeCustomerSubscriptionId
        );
      } catch (e) {
        console.log(`
              Unable to migrate hacker user - subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}
            `);
        await db.user.update(user.id, {
          isActiveSubscription: false,
        });
        res.json({
          errors: [
            `Unable to migrate hacker user - subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
          ],
        });
        return;
      }

      if (subscription.status != "active") {
        console.log(`
              Unable to migrate hacker user - user=${user.id} has a status=${subscription.status} subscription
            `);
        await db.user.update(user.id, {
          isActiveSubscription: false,
        });
        res.json({
          errors: [
            `Unable to migrate hacker user - user=${user.id} has a status=${subscription.status} subscription`,
          ],
        });
        return;
      }

      const subscriptionItems = await req.stripe.subscriptionItems.list({
        subscription: user.stripeCustomerSubscriptionId,
      });

      subscription = await req.stripe.subscriptions.update(
        user.stripeCustomerSubscriptionId,
        {
          billing_cycle_anchor: "now",
          cancel_at_period_end: false,
          items: [
            ...subscriptionItems.data.map((item) => {
              // Check if the item is metered
              const isMetered = item.price.recurring.usage_type === "metered";
              return {
                id: item.id,
                deleted: true,
                clear_usage: isMetered ? true : undefined, // If metered, clear usage
                price: item.price.id,
              };
            }),
            ...items.data.map((item) => ({
              price: item.id,
            })),
          ],
        }
      );

      await db.user.update(user.id, {
        stripeCustomerId: user.stripeCustomerId,
        stripeProductId: "prod_0",
        stripeCustomerSubscriptionId: subscription.id,
      });
    }
  } else {
    res.json({
      errors: [
        `Unable to migrate hacker user - customer not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
      ],
    });
    await db.user.update(user.id, {
      isActiveSubscription: false,
    });
    return;
  }
  res.json({
    result: "Migrated user with email " + user.email + " to personal plan",
  });
});

app.post("/migrate-pro-user", async (req, res) => {
  if (req.config.stripeSecretKey != req.body.stripeSecretKey) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }

  const [users] = await db.user.find(
    [
      sql`users.data->>'stripeProductId' = 'prod_1' AND users.data->>'isActiveSubscription' = 'true'`,
    ],
    {
      limit: 1,
      useReplica: false,
    }
  );

  if (users.length == 0) {
    res.json({
      errors: ["no users found"],
    });
    return;
  }

  let user = users[0];

  const { data } = await req.stripe.customers.list({
    email: user.email,
  });

  if (data.length > 0) {
    if (
      user.stripeProductId === "prod_1" &&
      user.newStripeProductId !== "growth_1" &&
      user.newStripeProductId !== "scale_1"
    ) {
      const items = await req.stripe.prices.list({
        lookup_keys: products["prod_O9XuIjn7EqYRVW"].lookupKeys,
      });
      let subscription;

      try {
        subscription = await req.stripe.subscriptions.retrieve(
          user.stripeCustomerSubscriptionId
        );
      } catch (e) {
        console.log(`
              Unable to migrate pro user - subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}
            `);
        await db.user.update(user.id, {
          isActiveSubscription: false,
        });
        res.json({
          errors: [
            `Unable to migrate pro user - subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
          ],
        });
        return;
      }

      if (subscription.status != "active") {
        console.log(`
              Unable to migrate pro user - user=${user.id} has a status=${subscription.status} subscription
            `);
        await db.user.update(user.id, {
          isActiveSubscription: false,
        });
        res.json({
          errors: [
            `Unable to migrate pro user - user=${user.id} has a status=${subscription.status} subscription`,
          ],
        });
        return;
      }

      const subscriptionItems = await req.stripe.subscriptionItems.list({
        subscription: user.stripeCustomerSubscriptionId,
      });

      let payAsYouGoItems = [];
      if (products[user.stripeProductId].payAsYouGo) {
        const payAsYouGoPrices = await req.stripe.prices.list({
          lookup_keys: products["pay_as_you_go_1"].lookupKeys,
        });
        payAsYouGoItems = payAsYouGoPrices.data.map((item) => ({
          price: item.id,
        }));
      }

      subscription = await req.stripe.subscriptions.update(
        user.stripeCustomerSubscriptionId,
        {
          billing_cycle_anchor: "now",
          cancel_at_period_end: false,
          items: [
            ...subscriptionItems.data.map((item) => {
              const isMetered = item.price.recurring.usage_type === "metered";
              return {
                id: item.id,
                deleted: true,
                clear_usage: isMetered ? true : undefined,
                price: item.price.id,
              };
            }),
            ...items.data.map((item) => ({
              price: item.id,
            })),
            ...payAsYouGoItems,
          ],
        }
      );

      await db.user.update(user.id, {
        stripeCustomerId: user.stripeCustomerId,
        stripeProductId: "prod_O9XuIjn7EqYRVW",
        stripeCustomerSubscriptionId: subscription.id,
        oldProPlan: true,
      });
    }
  } else {
    res.json({
      errors: [
        `Unable to migrate pro user - customer not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
      ],
    });
    await db.user.update(user.id, {
      isActiveSubscription: false,
    });
    return;
  }
  res.json({
    result: "Migrated pro user with email " + user.email + " to hacker plan",
  });
});

app.post("/migrate-test-products", async (req, res) => {
  if (req.config.stripeSecretKey != req.body.stripeSecretKey) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }

  const [currentUser, _newCursor] = await db.user.find(
    [sql`users.data->>'stripeCustomerId' IS NOT NULL`],
    {
      limit: 1,
      useReplica: false,
    }
  );

  if (currentUser.length < 0) {
    res.json({
      errors: ["no users found"],
    });
    return;
  }

  let user = currentUser[0];

  // If user.newStripeProductId is in testProducts, migrate it to the new product
  if (testProducts.includes(user.newStripeProductId)) {
    // get the stripe customer
    const customer = await req.stripe.customers.get({
      email: user.email,
    });

    let payAsYouGoItems = [];
    let isPayAsYouGoPlan =
      products[productMapping[user.newStripeProductId]].payAsYouGo;

    // Get the prices associated with the subscription
    const subscriptionItems = await req.stripe.subscriptionItems.list({
      subscription: user.stripeCustomerSubscriptionId,
    });

    // fetch prices associated with new product
    const items = await req.stripe.prices.list({
      lookup_keys: products[productMapping[user.newStripeProductId]].lookupKeys,
    });

    if (isPayAsYouGoPlan) {
      // Get the prices for the pay as you go product
      const payAsYouGoPrices = await req.stripe.prices.list({
        lookup_keys: products["pay_as_you_go_1"].lookupKeys,
      });

      // Map the prices to the additional items array
      payAsYouGoItems = payAsYouGoPrices.data.map((item) => ({
        price: item.id,
      }));
    }

    // Subscribe the user to the new product
    const subscription = await req.stripe.subscriptions.update(
      user.stripeCustomerSubscriptionId,
      {
        billing_cycle_anchor: "now", // reset billing anchor when updating subscription
        items: [
          ...subscriptionItems.data.map((item) => {
            // Check if the item is metered
            const isMetered = item.price.recurring.usage_type === "metered";
            return {
              id: item.id,
              deleted: true,
              clear_usage: isMetered ? true : undefined, // If metered, clear usage
              price: item.price.id,
            };
          }),
          ...items.data.map((item) => ({
            price: item.id,
          })),
          ...payAsYouGoItems,
        ],
      }
    );

    // Update user's customer, product, subscription, and payment id in our db
    await db.user.update(user.id, {
      stripeCustomerId: customer.id,
      stripeProductId: productMapping[user.newStripeProductId],
      stripeCustomerSubscriptionId: subscription.id,
      stripeCustomerPaymentMethodId: null,
      newStripeProductId: null,
    });
  }

  res.json({
    result: "Migrated user with email " + user.email + " to new product",
  });
});

export default app;
