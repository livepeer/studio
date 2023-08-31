import { Router, Request } from "express";
import { db } from "../store";
import Stripe from "stripe";
import { products } from "../config";
import sql from "sql-template-strings";
import fetch from "node-fetch";
import qs from "qs";
import { sendgridEmailPaymentFailed } from "./helpers";
import { WithID } from "../store/types";
import { User } from "../schema/types";
import { authorizer } from "../middleware";

const app = Router();

const testProducts = ["hacker_1", "growth_1", "scale_1"];

const productMapping = {
  hacker_1: "prod_O9XuIjn7EqYRVW",
  growth_1: "prod_O9XtHhI6rbTT1B",
  scale_1: "prod_O9XtcfOSMjSD5L",
};

export const reportUsage = async (req: Request, adminToken: string) => {
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
      sql`users.data->>'oldProPlan' = 'true' AND users.data->>'stripeProductId' IN ('hacker_1','prod_O9XuIjn7EqYRVW')`,
    ],
    {
      limit: 9999999999,
      useReplica: true,
    }
  );

  // Current date in milliseconds
  const currentDateMillis = new Date().getTime();
  const oneMonthMillis = 31 * 24 * 60 * 60 * 1000;

  // One month ago unix millis timestamp
  const cutOffDate = currentDateMillis - oneMonthMillis;

  const [hackerUsers] = await db.user.find([
    sql`users.data->>'stripeProductId' IN ('hacker_1','prod_O9XuIjn7EqYRVW') AND (users.data->>'lastStreamedAt')::bigint > ${cutOffDate}`,
  ]);

  const payAsYouGoUsers = [...users, ...oldProPlanUsers, ...hackerUsers];

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
        usageReported: false,
        error: e.message,
      });
    }
  }

  return {
    updatedUsers: updatedUsers,
  };
};

async function reportUsageForUser(
  req: Request,
  user: WithID<User>,
  adminToken: string,
  actuallyReport: boolean = true
) {
  if (user.email.endsWith("@livepeer.org") || user.admin) {
    return {
      id: user.id,
      overUsage: {},
      usage: {},
      isLivepeer: true,
      usageReported: true,
    };
  }

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

  if (
    (actuallyReport && user.stripeProductId.includes("hacker_1")) ||
    user.stripeProductId.includes("prod_O9XuIjn7EqYRVW")
  ) {
    if (
      !user.stripeCustomerPaymentMethodId &&
      (overUsage.TotalUsageMins > 0 ||
        overUsage.DeliveryUsageMins > 0 ||
        overUsage.StorageUsageMins > 0)
    ) {
      console.log(`
        User=${user.id} is in overusage but doesn't have a payment method, notyfing support team
      `);
      let emailSent = await sendgridEmailPaymentFailed({
        email: "help@livepeer.org",
        supportAddr: req.config.supportAddr,
        sendgridApiKey: req.config.sendgridApiKey,
        user,
        invoiceId: null,
        invoiceUrl: null,
        templateId: req.config.sendgridTemplateId,
      });

      if (emailSent) {
        await db.user.update(user.id, {
          lastEmailAboutPaymentFailure: Date.now(),
        });
      }
      return {};
    }
    // If they have a card and in overusage, report the usage
  }

  if (actuallyReport) {
    // create a map of subscription items by their lookup keys
    const subscriptionItemsByLookupKey = subscriptionItems.data.reduce(
      (acc, item) => {
        acc[item.price.lookup_key] = item.id;
        return acc;
      },
      {} as Record<string, string>
    );
    await sendUsageRecordToStripe(
      user,
      req,
      subscriptionItemsByLookupKey,
      overUsage
    );
  }

  return {
    id: user.id,
    overUsage: overUsage,
    usage: billingUsage,
    isLivepeer: false,
    billingCycleStart,
    billingCycleEnd,
    usageReported: actuallyReport,
  };
}

const sendUsageRecordToStripe = async (
  user: WithID<User>,
  req: Request,
  subscriptionItemsByLookupKey,
  overUsage
) => {
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
};

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
    let invoiceUrl = invoice.invoice_pdf;

    const [users] = await db.user.find(
      { stripeCustomerId: invoice.customer },
      { useReplica: false }
    );

    if (users.length < 1) {
      res.status(404);
      return res.json({ errors: ["user not found"] });
    }

    const user = users[0];

    console.log(`
       invoice=${invoice.id} payment failed for user=${user.id} notifying support team
    `);

    let emailSent = await sendgridEmailPaymentFailed({
      email: "help@livepeer.org",
      supportAddr: req.config.supportAddr,
      sendgridApiKey: req.config.sendgridApiKey,
      user,
      invoiceId: invoice.id,
      invoiceUrl: invoiceUrl,
      templateId: req.config.sendgridTemplateId,
    });

    if (emailSent) {
      await db.user.update(user.id, {
        lastEmailAboutPaymentFailure: Date.now(),
      });
    }
  }

  // Return a response to acknowledge receipt of the event
  return res.sendStatus(200);
});

app.post("/hacker/migration/pay-as-you-go", async (req, res) => {
  if (req.config.stripeSecretKey != req.body.stripeSecretKey) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }
  let migration = [];

  let hackerPlan = "prod_O9XuIjn7EqYRVW";

  if (req.body.staging === true) {
    hackerPlan = "hacker_1";
  }

  let user;

  if (req.body.userId) {
    user = await db.user.get(req.body.userId);
    migration.push(`Select migration for user ${user.email}`);
  } else {
    const [users] = await db.user.find(
      [
        sql`users.data->>'stripeProductId' = '${hackerPlan}' 
            AND (users.data->>'migrated' = 'false' OR users.data->>'migrated' IS NULL)`,
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

    user = users[0];
  }

  migration.push(`Migrating user ${user.email}`);

  const { data } = await req.stripe.customers.list({
    email: user.email,
  });

  if (data.length > 0) {
    if (user.stripeProductId === hackerPlan) {
      migration.push(
        `User ${user.email} is subscribing to pay as you go from ${user.stripeProductId}`
      );
      const items = await req.stripe.prices.list({
        lookup_keys: products[hackerPlan].lookupKeys,
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
              Unable to subscribe hacker user  to pay as you go plans - subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}
            `);
        await db.user.update(user.id, {
          migrated: true,
        });
        res.json({
          errors: [
            `Unable to subscribe hacker user  to pay as you go plans - subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
          ],
        });
        return;
      }

      if (subscription.status != "active") {
        console.log(`
              Unable to subscribe hacker user to pay as you go plans - user=${user.id} has a status=${subscription.status} subscription
            `);
        await db.user.update(user.id, {
          migrated: true,
        });
        res.json({
          errors: [
            `Unable to subscribe hacker user  to pay as you go plans - user=${user.id} has a status=${subscription.status} subscription`,
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

        const payAsYouGoPrices = await req.stripe.prices.list({
          lookup_keys: products["pay_as_you_go_1"].lookupKeys,
        });
        const payAsYouGoItems = payAsYouGoPrices.data.map((item) => ({
          price: item.id,
        }));

        let usageReport = await reportUsageForUser(
          req,
          user,
          req.body.token,
          false
        );

        if (!req.body.actually_migrate) {
          res.json({
            user: {
              email: user.email,
              stripeCustomerId: user.stripeCustomerId,
              stripeCustomerSubscriptionId: user.stripeCustomerSubscriptionId,
            },
            product: user.stripeProductId,
            subscriptionItems,
            items,
            payAsYouGoItems,
            usageReport,
          });
          return;
        }

        subscription = await req.stripe.subscriptions.update(
          user.stripeCustomerSubscriptionId,
          {
            proration_behavior: "none",
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
              ...payAsYouGoItems,
            ],
          }
        );

        migration.push(
          `User ${user.email} has been updated to ${subscription.id}`
        );

        await db.user.update(user.id, {
          stripeCustomerId: user.stripeCustomerId,
          stripeProductId:
            req.body.staging === true ? "hacker_1" : "prod_O9XuIjn7EqYRVW",
          stripeCustomerSubscriptionId: subscription.id,
          migrated: true,
        });

        migration.push(`User ${user.email} has been updated in the database`);
      } catch (e) {
        console.log(`
              Unable to subscribe hacker user - cannot update the user subscription or update the user data user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}
            `);
        res.json({
          errors: [
            `Unable to subscribe hacker user - cannot update the user subscription or update the user data user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
          ],
        });
        await db.user.update(user.id, {
          migrated: true,
        });
        return;
      }
    } else {
      res.json({
        errors: [
          `Unable to subscribe hacker user - user is already subscribed to ${user.stripeProductId}`,
        ],
      });
      await db.user.update(user.id, {
        migrated: true,
      });
      return;
    }
  } else {
    res.json({
      errors: [
        `Unable to migrate personal user - customer not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
      ],
    });
    await db.user.update(user.id, {
      migrated: true,
    });
    return;
  }

  let usageReport = await reportUsageForUser(req, user, req.body.token, true);

  migration.push(
    `User ${user.email} has been subscribed to pay as you go plans`
  );
  res.json({
    result:
      "Subscribed user with email " + user.email + " to pay as you go plans",
    migration: migration,
    usageReport,
  });
});

app.post("/migrate-pro-user", async (req, res) => {
  if (req.config.stripeSecretKey != req.body.stripeSecretKey) {
    res.status(403);
    return res.json({ errors: ["unauthorized"] });
  }

  const [users] = await db.user.find(
    [
      sql`users.data->>'stripeProductId' = 'prod_1' AND (users.data->>'isActiveSubscription' = 'true' OR users.data->>'isActiveSubscription' IS NULL)`,
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
    if (user.stripeProductId === "prod_1") {
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

      const payAsYouGoPrices = await req.stripe.prices.list({
        lookup_keys: products["pay_as_you_go_1"].lookupKeys,
      });
      payAsYouGoItems = payAsYouGoPrices.data.map((item) => ({
        price: item.id,
      }));

      if (!req.body.actually_migrate) {
        res.json({
          migrating_user: {
            email: user.email,
            stripe_customer_id: user.stripeCustomerId,
            id: user.id,
          },
          from_product: user.stripeProductId,
          pay_as_you_go_items_to_apply: payAsYouGoItems,
          subscription_items_to_apply: items,
        });
        return;
      }

      subscription = await req.stripe.subscriptions.update(
        user.stripeCustomerSubscriptionId,
        {
          proration_behavior: "none",
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

app.post(
  "/subscribe-to-enterprise",
  authorizer({ anyAdmin: true }),
  async (req, res) => {
    let enterprisePlan = "prod_OTTbwpzxNLMNSh";

    if (req.body.staging === true) {
      enterprisePlan = "prod_OTTwpzjA4U8B2P";
    }

    const userId = req.body.userId;

    const [users] = await db.user.find([sql`users.id = ${userId}`], {
      limit: 1,
      useReplica: false,
    });

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
      const items = await req.stripe.prices.list({
        lookup_keys: products[enterprisePlan].lookupKeys,
      });

      let subscription;

      try {
        subscription = await req.stripe.subscriptions.retrieve(
          user.stripeCustomerSubscriptionId
        );
      } catch (e) {
        console.log(`
            error- subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}
          `);
        await db.user.update(user.id, {
          isActiveSubscription: false,
        });
        res.json({
          errors: [
            `error - subscription not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
          ],
        });
        return;
      }

      const subscriptionItems = await req.stripe.subscriptionItems.list({
        subscription: user.stripeCustomerSubscriptionId,
      });

      if (!req.body.actually_migrate) {
        res.json({
          migrating_user: {
            email: user.email,
            stripe_customer_id: user.stripeCustomerId,
            id: user.id,
          },
          from_product: user.stripeProductId,
          pay_as_you_go_items_to_apply: [],
          subscription_items_to_apply: items,
        });
        return;
      }

      subscription = await req.stripe.subscriptions.update(
        user.stripeCustomerSubscriptionId,
        {
          proration_behavior: "none",
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
          ],
        }
      );

      await db.user.update(user.id, {
        stripeCustomerId: user.stripeCustomerId,
        stripeProductId:
          req.body.staging === true
            ? "prod_OTTwpzjA4U8B2P"
            : "prod_OTTbwpzxNLMNSh",
        stripeCustomerSubscriptionId: subscription.id,
      });
    } else {
      res.json({
        errors: [
          `Unable to migrate user - customer not found for user=${user.id} email=${user.email} subscriptionId=${user.stripeCustomerSubscriptionId}`,
        ],
      });
      return;
    }
    res.json({
      result: "Migrated user with email " + user.email + " to enterprise plan",
    });
  }
);

export default app;
