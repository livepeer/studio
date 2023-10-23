import { Router, Request } from "express";
import { db } from "../store";
import { products } from "../config";
import sql from "sql-template-strings";
import { sendgridEmailPaymentFailed } from "./helpers";
import { WithID } from "../store/types";
import { User } from "../schema/types";
import { authorizer } from "../middleware";
import { getUsageData } from "./usage";
import {
  notifyUser,
  getUsageNotifications,
  notifyMissingPaymentMethod,
} from "./utils/notification";
import { sleep } from "../util";

const app = Router();

export const reportUsage = async (req: Request, adminToken: string) => {
  let payAsYouGoUsers = await getPayAsYouGoUsers();

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

async function getPayAsYouGoUsers() {
  const [users] = await db.user.find(
    [
      sql`users.data->>'stripeProductId' IN ('growth_1', 'scale_1', 'prod_O9XtHhI6rbTT1B','prod_O9XtcfOSMjSD5L')`,
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
    sql`
      LEFT JOIN asset a
      ON u.data->>'id' = a.data->>'userId'
      AND CAST(a.data->>'createdAt' AS bigint) > ${cutOffDate}

      WHERE 
      (
          a.data->>'createdAt' IS NOT NULL 
          OR 
          CAST(u.data->>'lastStreamedAt' AS bigint) > ${cutOffDate}
      )
      AND
      u.data->>'stripeProductId' IN ('hacker_1', 'prod_O9XuIjn7EqYRVW');
  `,
  ]);

  const payAsYouGoUsers = [...users, ...hackerUsers];
  return payAsYouGoUsers;
}

async function reportUsageForUser(
  req: Request,
  user: WithID<User>,
  adminToken: string,
  actuallyReport: boolean = true,
  forceReport: boolean = false,
  from?: number,
  to?: number
) {
  if (!forceReport && (user.email.endsWith("@livepeer.org") || user.admin)) {
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

  let billingCycleStart = userSubscription.current_period_start * 1000; // 1685311200000 // Test date
  let billingCycleEnd = userSubscription.current_period_end * 1000; // 1687989600000 // Test date

  if (from && to) {
    billingCycleStart = from;
    billingCycleEnd = to;
  }

  const ingests = await req.getIngest();

  const usageData = await getUsageData(
    user,
    billingCycleStart,
    billingCycleEnd,
    ingests,
    adminToken
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
      (usageData.overUsage.TotalUsageMins > 0 ||
        usageData.overUsage.DeliveryUsageMins > 0 ||
        usageData.overUsage.StorageUsageMins > 0)
    ) {
      await notifyMissingPaymentMethod(user, req);
    }
  }

  const usageNotifications = await getUsageNotifications(
    usageData.usagePercentages,
    user
  );

  if (usageNotifications.length > 0) {
    await notifyUser(usageNotifications, user, req.config);
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
      usageData.overUsage
    );
  }

  // Sleep to avoid to incur into stripe rate limits
  await sleep(100);

  return {
    id: user.id,
    usageData,
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

    if (user.stripeProductId == "prod_1") {
      // Old usage invoicing
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
    }
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

    try {
      // Try catch to still respond to stripe even if email fails
      let lastNotification = user.notifications?.lastEmailAboutPaymentFailure;

      if (lastNotification) {
        let now = Date.now();
        let diff = now - lastNotification;
        let days = diff / (1000 * 60 * 60 * 24);
        if (days < 7) {
          console.log(`
            Not sending email for payment failure of user=${user.id} because team was notified less than 7 days ago
          `);
          return res.sendStatus(200);
        }
      }

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
          notifications: {
            lastEmailAboutPaymentFailure: Date.now(),
          },
        });
      }
    } catch (e) {
      console.log(`
        Failed to send email for payment failure of user=${user.id} with error=${e.message}
      `);
    }
  }

  // Return a response to acknowledge receipt of the event
  return res.sendStatus(200);
});

app.post(
  "/user/subscribe/enterprise",
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
          billing_cycle_anchor: "unchanged",
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
