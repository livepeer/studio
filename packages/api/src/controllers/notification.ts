import { sendgridEmail } from "./helpers";
import { frontendUrl, unsubscribeUrl } from "./user";
import { db } from "../store";
import { sendgridEmailPaymentFailed } from "./helpers";
import { WithID } from "../store/types";
import { Request } from "express";
import { User } from "../schema/types";

export const getUsageNotifications = async (
  usagePercentages,
  user: WithID<User>
) => {
  let notifications = [];

  if (
    usagePercentages.TotalUsageMins > 90 ||
    usagePercentages.DeliveryUsageMins > 90 ||
    usagePercentages.StorageUsageMins > 90
  ) {
    notifications.push({
      type: "notification90",
      title: "Usage Warning",
      message: `Your usage is over 90% of your limit.`,
    });
  } else if (
    usagePercentages.TotalUsageMins > 75 ||
    usagePercentages.DeliveryUsageMins > 75 ||
    usagePercentages.StorageUsageMins > 75
  ) {
    await db.user.update(user.id, {
      notifications: {
        usage: {
          notification75: true,
        },
      },
    });
  } else {
    if (
      user.notifications?.usage?.notification75 ||
      user.notifications?.usage?.notification90
    ) {
      await db.user.update(user.id, {
        notifications: {
          usage: {
            notification75: false,
            notification90: false,
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
      notifications: {
        lastEmailAboutPaymentFailure: Date.now(),
      },
    });
  }
};
