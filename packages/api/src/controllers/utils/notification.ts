import { sendgridEmail } from "../helpers";
import { frontendUrl, unsubscribeUrl } from "../user";
import { db } from "../../store";
import { sendgridEmailPaymentFailed } from "../helpers";
import { WithID } from "../../store/types";
import { Request } from "express";
import { User } from "../../schema/types";

export const HACKER_DISABLE_CUTOFF_DATE = 1697752800000;

export const getUsageNotifications = async (
  usagePercentages: {
    TotalUsageMins: number;
    DeliveryUsageMins: number;
    StorageUsageMins: number;
  },
  user: WithID<User>
) => {
  let notifications = [];
  const { TotalUsageMins, DeliveryUsageMins, StorageUsageMins } =
    usagePercentages;

  if (
    [TotalUsageMins, DeliveryUsageMins, StorageUsageMins].some(
      (min) => min > 90
    )
  ) {
    notifications.push({
      type: "notification100",
      title: "Usage Warning",
      message: `You have exceeded your usage limit. Please upgrade your plan.`,
    });

    if (user.createdAt > HACKER_DISABLE_CUTOFF_DATE) {
      await db.user.update(user.id, {
        disabled: true,
      });
    }
  } else if (
    [TotalUsageMins, DeliveryUsageMins, StorageUsageMins].some(
      (min) => min > 90
    )
  ) {
    notifications.push({
      type: "notification90",
      title: "Usage Warning",
      message: `Your usage is over 90% of your limit.`,
    });
  } else if (
    [TotalUsageMins, DeliveryUsageMins, StorageUsageMins].some(
      (min) => min > 75
    )
  ) {
    notifications.push({
      type: "notification75",
      title: "Usage Warning",
      message: `Your usage is over 75% of your limit.`,
    });
  } else {
    if (
      user.notifications?.usage?.notification75 ||
      user.notifications?.usage?.notification90 ||
      user.notifications?.usage?.notification100
    ) {
      await db.user.update(user.id, {
        notifications: {
          usage: {
            notification75: false,
            notification90: false,
            notification100: false,
          },
        },
      });
    }
  }

  return notifications;
};

export const notifyUser = async (notifications, user, req) => {
  for (let notification of notifications) {
    if (user.notifications?.[notification.type]) {
      continue;
    }
    await sendgridEmail({
      email: user.email,
      supportAddr: req.config.supportAddr,
      sendgridTemplateId: req.config.sendgridTemplateId,
      sendgridApiKey: req.sendgridApiKey,
      subject: notification.title,
      buttonText: "View Dashboard",
      buttonUrl: frontendUrl(req, `/dashboard?`),
      preheader: notification.title,
      unsubscribe: unsubscribeUrl(req),
      text: [notification.message].join("\n\n"),
    });
    await db.user.update(user.id, {
      notifications: {
        usage: {
          [notification.type]: true,
        },
      },
    });
  }
};

export const notifyMissingPaymentMethod = async (
  user: WithID<User>,
  req: Request
) => {
  console.log(`
        User=${user.id} is in overusage but doesn't have a payment method, notifying support team
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
      notifications: {
        lastEmailAboutPaymentFailure: Date.now(),
      },
    });
  }
};
