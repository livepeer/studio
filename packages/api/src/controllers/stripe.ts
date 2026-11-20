import { Router } from "express";
import sql from "sql-template-strings";
import Stripe from "stripe";
import { products } from "../config";
import logger from "../logger";
import { authorizer } from "../middleware";
import { CliArgs } from "../parse-cli";
import { User } from "../schema/types";
import { db, jobsDb } from "../store";
import { WithID } from "../store/types";
import { Ingest } from "../types/common";
import { sleep } from "../util";
import { sendgridEmail, sendgridEmailPaymentFailed } from "./helpers";
import { getRecentlyActiveHackers, getUsageData } from "./usage";
import {
  HACKER_DISABLE_CUTOFF_DATE,
  getUsageNotifications,
  notifyUser,
} from "./utils/notification";

const app = Router();
const HELP_EMAIL = "help@livepeer.org";

export const reportUsage = async (
  stripe: Stripe,
  config: CliArgs,
  adminToken: string,
) => {
  const payAsYouGoUsers = await getPayAsYouGoUsers(config.ingest, adminToken);

  const updatedUsers = [];
  const pendingUsers = payAsYouGoUsers.slice();

  const processUser = async () => {
    while (true) {
      const user = pendingUsers.pop();
      if (!user) {
        return;
      }

      try {
        const userUpdated = await reportUsageForUser(
          stripe,
          config,
          user,
          adminToken,
        );
        updatedUsers.push(userUpdated);
      } catch (e) {
        logger.error(
          `Failed to create usage record for user=${user.id} with error=${e.message}`,
        );
        updatedUsers.push({
          id: user.id,
          usageReported: false,
          error: e.message,
        });
      }
    }
  };

  const workers = [];
  for (let i = 0; i < config.updateUsageConcurrency; i++) {
    workers.push(processUser());
  }
  await Promise.all(workers);

  return { updatedUsers };
};

async function getPayAsYouGoUsers(ingests: Ingest[], adminToken: string) {
  const [users] = await jobsDb.user.find(
    [
      sql`users.data->>'stripeProductId' IN ('growth_1', 'scale_1', 'prod_O9XtHhI6rbTT1B','prod_O9XtcfOSMjSD5L')`,
    ],
    {
      limit: 9999999999,
      useReplica: true,
    },
  );

  const hackerUsers = await getRecentlyActiveHackers(ingests, adminToken);

  const payAsYouGoUsers = [...users, ...hackerUsers];
  return payAsYouGoUsers;
}

async function reportUsageForUser(
  stripe: Stripe,
  config: CliArgs,
  user: WithID<User>,
  adminToken: string,
  actuallyReport: boolean = true,
  forceReport: boolean = false,
  from?: number,
  to?: number,
) {
  // make sure this func takes at least 100ms to avoid incurring into stripe rate limits
  const sleepProm = sleep(100);

  if (!forceReport && (user.email.endsWith("@livepeer.org") || user.admin)) {
    return {
      id: user.id,
      overUsage: {},
      usage: {},
      isLivepeer: true,
      usageReported: true,
    };
  }

  const userSubscription = await stripe.subscriptions.retrieve(
    user.stripeCustomerSubscriptionId,
  );

  let billingCycleStart = userSubscription.current_period_start * 1000; // 1685311200000 // Test date
  let billingCycleEnd = userSubscription.current_period_end * 1000; // 1687989600000 // Test date

  if (from && to) {
    billingCycleStart = from;
    billingCycleEnd = to;
  }

  const usageData = await getUsageData(
    user,
    billingCycleStart,
    billingCycleEnd,
    config.ingest,
    adminToken,
  );

  const subscriptionItems = await stripe.subscriptionItems.list({
    subscription: user.stripeCustomerSubscriptionId,
  });

  const product = products[user.stripeProductId];
  let usageToReport = usageData.overUsage;

  if (!product.minumumSpend) {
    const usageNotifications = await getUsageNotifications(
      usageData.usagePercentages,
      user,
    );

    if (usageNotifications.length > 0) {
      await notifyUser(usageNotifications, user, { headers: {}, config });
    }
  } else {
    const overage = await calculateOverageOnMinimumSpend(
      product,
      usageData.billingUsage,
    );
    usageToReport = overage;
  }

  if (actuallyReport) {
    // create a map of subscription items by their lookup keys
    const subscriptionItemsByLookupKey = subscriptionItems.data.reduce(
      (acc, item) => {
        acc[item.price.lookup_key] = item.id;
        return acc;
      },
      {} as Record<string, string>,
    );
    logger.info(`
      usage: reporting usage to stripe for user=${user.id} email=${user.email} from=${billingCycleStart} to=${billingCycleEnd}
    `);
    await sendUsageRecordToStripe(
      stripe,
      user,
      subscriptionItemsByLookupKey,
      usageToReport,
    );
  }

  await sleepProm;

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
  stripe: Stripe,
  user: WithID<User>,
  subscriptionItemsByLookupKey,
  overUsage,
) => {
  // Invoice items based on overusage
  await Promise.all(
    products[user.stripeProductId].usage.map(async (product) => {
      try {
        if (product.name === "Transcoding") {
          await stripe.subscriptionItems.createUsageRecord(
            subscriptionItemsByLookupKey["transcoding_usage"],
            {
              quantity: parseInt(overUsage.TotalUsageMins.toFixed(0)),
              timestamp: Math.floor(new Date().getTime() / 1000),
              action: "set",
            },
          );
        } else if (product.name === "Delivery") {
          await stripe.subscriptionItems.createUsageRecord(
            subscriptionItemsByLookupKey["tstreaming_usage"],
            {
              quantity: parseInt(overUsage.DeliveryUsageMins.toFixed(0)),
              timestamp: Math.floor(new Date().getTime() / 1000),
              action: "set",
            },
          );
        } else if (product.name === "Storage") {
          await stripe.subscriptionItems.createUsageRecord(
            subscriptionItemsByLookupKey["tstorage_usage2"],
            {
              quantity: parseInt(overUsage.StorageUsageMins.toFixed(0)),
              timestamp: Math.floor(new Date().getTime() / 1000),
              action: "set",
            },
          );
        }
      } catch (e) {
        logger.error(`
          error- failed to create usage record for user=${user.id} product=${product.name} with error=${e.message}
        `);
      }
    }),
  );
};

export const calculateOverageOnMinimumSpend = async (product, billingUsage) => {
  const minimumSpend = product.monthlyPrice;

  let { storageUsage, deliveryUsage, totalUsage } = billingUsage;

  let prices: any = {};

  if (product?.usage) {
    product.usage.forEach((item) => {
      if (item.name.toLowerCase() === "transcoding") {
        prices.transcoding = item.price;
      } else if (item.name.toLowerCase() === "delivery") {
        prices.streaming = item.price;
      } else if (item.name.toLowerCase() === "storage") {
        prices.storage = item.price;
      }
    });
  }

  let totalSpent =
    prices.storage * storageUsage +
    prices.streaming * deliveryUsage +
    prices.transcoding * totalUsage;

  // If the total spent is less than the minimum spend, return 0 for all usage
  // No usage is getting reported to Stripe, which, at the end of the billing cyle
  // will result in a (monthlyPrice)$ invoice + 0$ usage
  if (totalSpent <= minimumSpend) {
    return {
      StorageUsageMins: 0,
      DeliveryUsageMins: 0,
      TotalUsageMins: 0,
    };
  }

  // Calculate the X amount in $ that is over the minimum spend
  // Based on the current user usage
  let remainingOverage = totalSpent - minimumSpend;

  let overageUsage = {
    StorageUsageMins: 0,
    DeliveryUsageMins: 0,
    TotalUsageMins: 0,
  };

  const totalSpentInCategories = {
    storage: prices.storage * storageUsage,
    delivery: prices.streaming * deliveryUsage,
    transcoding: prices.transcoding * totalUsage,
  };

  let totalSpentOverage =
    totalSpentInCategories.storage +
    totalSpentInCategories.delivery +
    totalSpentInCategories.transcoding;

  // If the remaining overage is less than or equal to 0, return 0 for all usage
  // No usage is getting reported to Stripe, which, at the end of the billing cyle
  // will result in a (monthlyPrice)$ invoice + 0$ usage
  if (remainingOverage <= 0 || totalSpentOverage <= 0) {
    return {
      StorageUsageMins: 0,
      DeliveryUsageMins: 0,
      TotalUsageMins: 0,
    };
  }

  // If the usage is greater than 0, calculate the ratio of the remaining overage to the total spent
  // This ratio will be used to calculate the amount of usage to report to Stripe
  // distributed across the 3 product items with > $0 spend
  // The resulting invoice will be (monthlyPrice)$ + transcodingOverage*price + streamingOverage*price + storageOverage*price
  const overageRatio = remainingOverage / totalSpent;

  overageUsage.StorageUsageMins =
    (totalSpentInCategories.storage * overageRatio) / prices.storage;
  overageUsage.DeliveryUsageMins =
    (totalSpentInCategories.delivery * overageRatio) / prices.streaming;
  overageUsage.TotalUsageMins =
    (totalSpentInCategories.transcoding * overageRatio) / prices.transcoding;

  return overageUsage;
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
      { useReplica: false },
    );

    if (users.length < 1) {
      res.status(404);
      return res.json({ errors: ["Account not found"] });
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
        },
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
        }),
      );
    }
  } else if (event.type === "invoice.payment_failed") {
    // Notify via email
    const invoice = event.data.object;
    let invoiceUrl = invoice.invoice_pdf;

    const [users] = await db.user.find(
      { stripeCustomerId: invoice.customer },
      { useReplica: false },
    );

    if (users.length < 1) {
      res.status(404);
      return res.json({ errors: ["Account not found"] });
    }

    const user = users[0];

    logger.info(`
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
          logger.warn(`
            Not sending email for payment failure of user=${user.id} because team was notified less than 7 days ago
          `);
          return res.sendStatus(200);
        }
      }

      let emailSent = await sendgridEmailPaymentFailed({
        email: HELP_EMAIL,
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

      if (
        user.stripeProductId &&
        (user.stripeProductId == "prod_O9XtHhI6rbTT1B" ||
          user.stripeProductId == "prod_O9XtcfOSMjSD5L") &&
        user.createdAt > HACKER_DISABLE_CUTOFF_DATE
      ) {
        let allCustomerInvoices = await req.stripe.invoices.list({
          customer: user.stripeCustomerId,
          limit: 20,
        });

        let paidInvoices = allCustomerInvoices.data.filter(
          (invoice) => invoice.status === "paid" && invoice.amount_due > 0,
        );

        if (paidInvoices.length === 0) {
          await db.user.update(user.id, {
            disabled: true,
          });
          await sendgridEmail({
            email: HELP_EMAIL,
            supportAddr: req.config.supportAddr,
            sendgridTemplateId: req.config.sendgridTemplateId,
            sendgridApiKey: req.config.sendgridApiKey,
            subject: "User disabled for a failed payment",
            preheader: "User disabled for a failed payment",
            buttonText: "See on Stripe Dashboard",
            buttonUrl:
              "https://dashboard.stripe.com/customers/" + user.stripeCustomerId,
            unsubscribe: "",
            text: [
              `Customer ${user.email} has been disabled due to failed payment.`,
            ].join("\n\n"),
          });
          await sendgridEmail({
            email: user.email,
            supportAddr: req.config.supportAddr,
            sendgridTemplateId: req.config.sendgridTemplateId,
            sendgridApiKey: req.config.sendgridApiKey,
            subject: "Your Livepeer Studio account has been disabled",
            preheader: "Please update your payment method",
            buttonText: "Go to Dashboard",
            buttonUrl: "https://livepeer.studio/dashboard/billing",
            unsubscribe: "",
            text: `
              Your Livepeer Studio account has been disabled due to a failed payment.

              Please update your payment method to reactivate your account.
            `,
          });
        }
      }
    } catch (e) {
      logger.error(`
        Failed to send email for payment failure of user=${user.id} with error=${e.message}
      `);
    }
  }

  // Return a response to acknowledge receipt of the event
  return res.sendStatus(200);
});

app.patch(
  "/user/subscription",
  authorizer({ anyAdmin: true }),
  async (req, res) => {
    const {
      userId,
      stripeProductId,
      stripeCustomerSubscriptionId,
      stripeCustomerId,
    } = req.body;

    const user = await db.user.get(userId);

    if (!user) {
      res.status(404);
      return res.json({ errors: ["Account not found"] });
    }

    if (stripeCustomerSubscriptionId) {
      const subscription = await req.stripe.subscriptions.retrieve(
        stripeCustomerSubscriptionId,
      );

      if (!subscription) {
        res.status(404);
        return res.json({ errors: ["subscription not found"] });
      }

      if (subscription.status === "canceled") {
        res.status(400);
        return res.json({ errors: ["subscription is canceled"] });
      }
    }

    if (stripeCustomerId) {
      const customer = await req.stripe.customers.retrieve(stripeCustomerId);

      if (!customer) {
        res.status(404);
        return res.json({ errors: ["customer not found"] });
      }
    }

    await db.user.update(user.id, {
      stripeProductId,
      stripeCustomerSubscriptionId,
      stripeCustomerId,
    });

    res.status(200);
    return res.json({ result: "user subscription updated" });
  },
);

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
          user.stripeCustomerSubscriptionId,
        );
      } catch (e) {
        logger.error(`
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
        },
      );

      await db.user.update(user.id, {
        stripeCustomerId: user.stripeCustomerId,
        stripeProductId:
          req.body.staging === true
            ? "prod_OTTwpzjA4U8B2P"
            : "prod_OTTbwpzxNLMNSh",
        stripeCustomerSubscriptionId: subscription.id,
        disabled: false,
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
  },
);

export default app;
