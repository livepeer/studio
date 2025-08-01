import validator from "email-validator";
import { Request, RequestHandler, Router } from "express";
import jwt from "jsonwebtoken";
import ms from "ms";
import qs from "qs";
import Stripe from "stripe";
import { v4 as uuid } from "uuid";

import sql from "sql-template-strings";
import { products } from "../config";
import hash from "../hash";
import logger from "../logger";
import { authorizer, validatePost } from "../middleware";
import { EMAIL_VERIFICATION_CUTOFF_DATE } from "../middleware/auth";
import { CliArgs } from "../parse-cli";
import {
  CreateCustomer,
  CreateSubscription,
  DisableUserPayload,
  PasswordResetConfirm,
  PasswordResetTokenRequest,
  RefreshTokenPayload,
  SuspendUserPayload,
  UpdateSubscription,
  User,
  Project,
} from "../schema/types";
import { db } from "../store";
import { InternalServerError, NotFoundError } from "../store/errors";
import { WithID } from "../store/types";
import {
  FieldsMap,
  deleteAllOwnedObjects,
  makeNextHREF,
  parseFilters,
  parseOrder,
  recaptchaVerify,
  sendgridEmail,
  sendgridValidateEmail,
  sendgridValidateEmailAsync,
  toStringValues,
  triggerCatalystStreamStopSessions,
} from "./helpers";
import { isFakeEmail } from "fakefilter";

const adminOnlyFields = ["verifiedAt", "planChangedAt", "viewerLimit"];

const salesEmail = "sales@livepeer.org";
const infraEmail = "infraservice@livepeer.org";
const freePlan = "prod_O9XuIjn7EqYRVW";

// Ratio of the refresh token lifetime at which point we should issue a new
// refresh token. This is to avoid having refresh tokens that never expire or
// creating objects on the DB for every JWT (access token) that we sign.
export const REFRESH_TOKEN_REFRESH_THRESHOLD = 0.2;

// Ratio of the access token lifetime to require in between consecutive token
// refreshes using the same refresh token. This means a refresh token can only
// be used once every 50% of the access tokens lifetime. This is a simple logic
// to detect malicious usage of a refresh token, e.g. if it leaks from the user
// browser. We can improve these checks later like enforcing same device/IP/etc.
export const REFRESH_TOKEN_MIN_REUSE_DELAY_RATIO = 0.5;

function cleanAdminOnlyFields(fields: string[], obj: Record<string, any>) {
  for (const f of fields) {
    delete obj[f];
  }
}

function cleanUserFields(user: WithID<User>, isAdmin = false) {
  if (!user) return user;

  user = db.user.cleanWriteOnlyResponse(user);
  if (!isAdmin) {
    cleanAdminOnlyFields(adminOnlyFields, user);
  }
  return user;
}

async function findUserByEmail(email: string, useReplica = true) {
  // Look for user by lowercase email
  const [lowercaseUsers] = await db.user.find(
    { email: email.toLowerCase() },
    { useReplica },
  );
  if (lowercaseUsers?.length === 1) {
    return lowercaseUsers[0];
  } else if (lowercaseUsers.length > 1) {
    throw new InternalServerError("multiple users found with same email");
  }

  // Look for user by original email
  const [users] = await db.user.find({ email }, { useReplica });
  if (!users?.length) {
    throw new NotFoundError("Account not found");
  } else if (users.length > 1) {
    throw new InternalServerError("multiple users found with same email");
  }
  return users[0];
}

async function isEmailRegistered(
  email: string,
  useReplica = true,
): Promise<boolean> {
  // Check if lowercase email is already registered
  const [lowercaseUsers] = await db.user.find(
    { email: email.toLowerCase() },
    { useReplica },
  );
  if (lowercaseUsers?.length > 0) return true;

  // Check if original email is already registered
  const [users] = await db.user.find({ email }, { useReplica });
  return users?.length > 0;
}

export const frontendUrl = (
  {
    headers: { "x-forwarded-proto": proto },
    config: { frontendDomain },
  }: Pick<Request, "headers" | "config">,
  path: string,
) => `${proto || "https"}://${frontendDomain}${path}`;

export const unsubscribeUrl = (req: Pick<Request, "headers" | "config">) =>
  frontendUrl(req, "/contact");

export async function terminateUserStreams(
  req: Request,
  userId: string,
): Promise<void> {
  const [streams] = await db.stream.find([
    sql`stream.data->>'parentId' IS NULL`,
    sql`stream.data->>'userId' = ${userId}`,
  ]);
  for (const stream of streams) {
    try {
      // we don't want to update all user stream objects, so trigger a manual stop sessions
      await triggerCatalystStreamStopSessions(req, stream.playbackId);
    } catch (err) {
      logger.error(
        `error suspending stream id=${stream.id} userId=${userId} err=${err}`,
      );
    }
  }
}

type StripeProductIDs = CreateSubscription["stripeProductId"];

const defaultProductId: StripeProductIDs = freePlan;

async function getOrCreateCustomer(stripe: Stripe, email: string) {
  const existing = await stripe.customers.list({ email });
  if (existing.data.length > 0) {
    return existing.data[0];
  }
  return await stripe.customers.create({ email });
}

async function createSubscription(
  stripe: Stripe,
  stripeProductId: StripeProductIDs,
  stripeCustomerId: string,
  withPayAsYouGo: boolean,
) {
  const existing = await stripe.subscriptions.list({
    customer: stripeCustomerId,
  });
  if (existing.data.length > 0) {
    return null;
  }

  const prices = await stripe.prices.list({
    lookup_keys: products[stripeProductId].lookupKeys,
  });

  let payAsYouGoItems = [];

  if (withPayAsYouGo) {
    const payAsYouGoPrices = await stripe.prices.list({
      lookup_keys: products["pay_as_you_go_1"].lookupKeys,
    });
    payAsYouGoItems = payAsYouGoPrices.data.map((item) => ({
      price: item.id,
    }));
  }

  return await stripe.subscriptions.create({
    cancel_at_period_end: false,
    customer: stripeCustomerId,
    items: [
      ...prices.data.map((item) => ({ price: item.id })),
      ...payAsYouGoItems,
    ],
    expand: ["latest_invoice.payment_intent"],
  });
}

async function createDefaultProject(userId: string): Promise<WithID<Project>> {
  return await db.project.create({
    id: uuid(),
    name: "Default Project",
    userId: userId,
    createdAt: Date.now(),
  });
}

function signUserJwt(
  userId: string,
  { jwtAudience, jwtSecret, jwtAccessTokenTtl }: CliArgs,
) {
  return jwt.sign({ sub: userId, aud: jwtAudience }, jwtSecret, {
    algorithm: "HS256",
    jwtid: uuid(),
    expiresIn: jwtAccessTokenTtl,
  });
}

function requireStripe(): RequestHandler {
  return (req, res, next) => {
    if (!req.stripe) {
      return res.status(501).json({ errors: ["stripe not configured"] });
    }
    return next();
  };
}

const app = Router();

app.get("/usage", authorizer({}), async (req, res) => {
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

const fieldsMap: FieldsMap = {
  id: `users.ID`,
  email: { val: `data->>'email'`, type: "full-text" },
  emailValid: { val: `data->'emailValid'`, type: "boolean" },
  admin: { val: `data->'admin'`, type: "boolean" },
  stripeProductId: `data->>'stripeProductId'`,
};

app.get("/", authorizer({ admin: true }), async (req, res) => {
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

app.get("/me", authorizer({ allowUnverified: true }), async (req, res) => {
  const user = await db.user.get(req.user.id);
  res.status(200);
  return res.json(cleanUserFields(user, req.user.admin));
});

app.get("/:id", authorizer({ allowUnverified: true }), async (req, res) => {
  if (req.user.admin !== true && req.user.id !== req.params.id) {
    return res.status(403).json({
      errors: ["user can only request information on their own user object"],
    });
  }
  const user = await db.user.get(req.params.id);
  res.status(200);
  res.json(cleanUserFields(user, req.user.admin));
});

app.delete("/:id", authorizer({ anyAdmin: true }), async (req, res) => {
  const { id } = req.params;
  const user = await db.user.get(id);
  if (!user) {
    res.status(404);
    return res.json({ errors: ["Account not found"] });
  }

  await db.user.markDeleted(id);
  await deleteAllOwnedObjects(req, { userId: id, deleted: false });

  res.status(204);
  res.end();
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
        req.config.recaptchaSecretKey,
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

  const isEmailRegisteredAlready = await isEmailRegistered(email);
  if (isEmailRegisteredAlready) {
    res.status(409);
    res.json({
      errors: [
        "email already registered - please sign in instead or check your verification email",
      ],
    });
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
      `first user detected, promoting new admin userId=${id} email=${email}`,
    );
    logger.warn("!!!!!!!!!!!!!!!!!!!");
    admin = true;
  }

  const lowercaseEmail = email.toLowerCase();

  let stripeFields: Partial<User> = {};
  if (req.stripe) {
    const customer = await getOrCreateCustomer(req.stripe, lowercaseEmail);
    const subscription = await createSubscription(
      req.stripe,
      defaultProductId,
      customer.id,
      true,
    );
    if (!subscription) {
      res.status(400);
      res.json({ errors: ["error creating subscription"] });
    }
    stripeFields = {
      stripeCustomerId: customer.id,
      stripeCustomerSubscriptionId: subscription.id,
      stripeProductId: defaultProductId,
    };
  }

  let project = await createDefaultProject(id);

  await db.user.create({
    kind: "user",
    id: id,
    createdAt: Date.now(),
    email: lowercaseEmail,
    password: hashedPassword,
    salt: salt,
    admin: admin,
    emailValidToken: emailValidToken,
    emailValid: validUser,
    firstName,
    lastName,
    organization,
    phone,
    defaultProjectId: project.id,
    ...stripeFields,
  });

  const user = cleanUserFields(await db.user.get(id, { useReplica: false }));
  if (!validUser && user) {
    const {
      supportAddr,
      sendgridTemplateId,
      sendgridApiKey,
      sendgridValidationApiKey,
    } = req.config;
    try {
      // This is a test of the Sendgrid email validation API. Remove this
      // if we decide not to use it and revert to more basic Sendgrid plan.
      sendgridValidateEmail(lowercaseEmail, sendgridValidationApiKey);
      // send email verification message to user using SendGrid
      await sendgridEmail({
        email: lowercaseEmail,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
        subject: "Verify your Livepeer Studio Email",
        preheader: "Welcome to Livepeer Studio!",
        buttonText: "Verify Email",
        buttonUrl: frontendUrl(
          req,
          `/dashboard/verify?${qs.stringify({
            email: lowercaseEmail,
            emailValidToken,
            selectedPlan,
          })}`,
        ),
        unsubscribe: unsubscribeUrl(req),
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

  let isTest =
    process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";

  if (
    req.config.requireEmailVerification &&
    !user.emailValid &&
    !user.admin &&
    !isTest &&
    user.createdAt > EMAIL_VERIFICATION_CUTOFF_DATE
  ) {
    res.status(403);
    return res.json({ errors: ["we just sent you a verification email"] });
  }

  res.status(201);
  res.json(user);
});

app.patch("/:id/email", authorizer({}), async (req, res) => {
  const { email } = req.body;
  const userId = req.user.id;

  if (userId !== req.params.id && !req.user.admin) {
    return res.status(403).json({
      errors: ["user can only update their own user object"],
    });
  }

  const lowerCaseEmail: string = email.toLowerCase();

  // Validate the new email
  const emailValid = validator.validate(lowerCaseEmail);
  if (!emailValid) {
    return res.status(422).json({ errors: ["Invalid email"] });
  }

  const isEmailRegisteredAlready = await isEmailRegistered(lowerCaseEmail);
  if (isEmailRegisteredAlready) {
    return res.status(409).json({
      errors: ["This email is already registered. Please choose another one."],
    });
  }

  const emailValidToken = uuid();

  if (req.user.admin) {
    if (!req.params.id) {
      console.log(`
        Admin user ${req.user.id} attempted to change email without providing userId
      `);
      return res
        .status(400)
        .json({ errors: ["userId is required for admins"] });
    }

    const user = await db.user.get(req.params.id);

    if (user.admin) {
      return res
        .status(400)
        .json({ errors: ["Cannot change email of admins"] });
    }

    if (!user) {
      return res.status(404).json({ errors: ["Account not found"] });
    }

    await db.user.update(req.params.id, {
      email: lowerCaseEmail,
    });

    res.status(200);
    return res.json({ message: "Email updated successfully." });
  }

  // Update user with newEmail (temporary field) and emailValidToken in database
  await db.user.update(userId, {
    newEmail: lowerCaseEmail,
    emailValidToken: emailValidToken,
  });

  try {
    await sendgridEmail({
      email: lowerCaseEmail,
      supportAddr: req.config.supportAddr,
      sendgridTemplateId: req.config.sendgridTemplateId,
      sendgridApiKey: req.config.sendgridApiKey,
      subject: "Verify Your New Email Address for Livepeer Studio",
      preheader: "Email Verification Needed!",
      buttonText: "Verify Email",
      buttonUrl: frontendUrl(
        req,
        `/dashboard/verify-new-email?${qs.stringify({
          emailValidToken,
          email: lowerCaseEmail,
        })}`,
      ),
      unsubscribe: unsubscribeUrl(req),
      text: ["Please verify your new email address."].join("\n\n"),
    });

    res.status(200).json({ message: "Verification email sent." });
  } catch (err) {
    res.status(400).json({ errors: [`Error sending email: ${err}`] });
  }
});

app.get("/verify/new-email", async (req, res) => {
  const { emailValidToken } = req.query;

  // Find user with matching emailValidToken
  const [[user]] = await db.user.find({ emailValidToken });

  if (!user) {
    return res
      .status(400)
      .json({ errors: ["Invalid or expired verification token."] });
  }

  // Update user's email field with the newEmail and remove newEmail field and emailValidToken
  await db.user.update(user.id, {
    email: user.newEmail,
    newEmail: null,
    emailValidToken: null,
  });

  // Redirect or send a response
  res.status(200).json({ message: "Email updated successfully." });
});

const suspensionEmailText = (
  emailTemplate: SuspendUserPayload["emailTemplate"],
) => {
  switch (emailTemplate) {
    case "copyright":
      return [
        "We were notified that your stream contained illegal or copyrighted content. We have suspended your account.",
        "Please note that you cannot use Livepeer to stream copyrighted content. Any copyrighted content will be taken down and your account will be suspended.",
      ].join("\n\n");
    case "disabled":
      return "Your account has been disabled. You reached your monthly usage limit for the free tier. Please upgrade your plan.";
    default:
      return "Your account has been suspended. Please contact us for more information.";
  }
};

app.patch(
  "/:id/suspended",
  validatePost("suspend-user-payload"),
  authorizer({ anyAdmin: true }),
  async (req, res) => {
    const { suspended, emailTemplate } = req.body as SuspendUserPayload;
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ errors: ["cannot suspend own user"] });
    }
    const user = await db.user.get(id);
    if (!user) {
      return res.status(404).json({ errors: ["not found"] });
    }
    const { email, suspended: wasSuspended } = user;

    logger.info(`set user ${id} (${email}) suspended ${suspended}`);
    await db.user.update(id, { suspended });

    if (suspended) {
      terminateUserStreams(req, id).catch((err) => {
        logger.error(
          `error terminating user streams id=${id} email=${email} err=${err}`,
        );
      });
    }

    if (suspended && !wasSuspended) {
      const {
        frontendDomain,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
      } = req.config;
      try {
        await sendgridEmail({
          email,
          bcc: infraEmail,
          supportAddr,
          sendgridTemplateId,
          sendgridApiKey,
          subject: "Account Suspended",
          preheader: `Your ${frontendDomain} account has been suspended.`,
          buttonText: "Appeal Suspension",
          buttonUrl: frontendUrl(req, "/contact"),
          unsubscribe: unsubscribeUrl(req),
          text: suspensionEmailText(emailTemplate),
        });
      } catch (err) {
        logger.error(
          `error sending suspension email to user=${email} err=${err}`,
        );
      }
    }

    res.status(204);
    res.end();
  },
);

app.patch(
  "/:id/disabled",
  validatePost("disable-user-payload"),
  authorizer({ anyAdmin: true }),
  async (req, res) => {
    const { disabled, emailTemplate } = req.body as DisableUserPayload;
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ errors: ["cannot disable own user"] });
    }
    const user = await db.user.get(id);
    if (!user) {
      return res.status(404).json({ errors: ["not found"] });
    }
    const { email, disabled: wasDisabled } = user;

    logger.info(`set user ${id} (${email}) disabled ${disabled}`);
    await db.user.update(id, { disabled });

    if (disabled) {
      terminateUserStreams(req, id).catch((err) => {
        logger.error(
          `error terminating user streams id=${id} email=${email} err=${err}`,
        );
      });
    }

    if (disabled && !wasDisabled) {
      const {
        frontendDomain,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
      } = req.config;
      try {
        console.log(`
          sending disabled email to user=${email} emailTemplate=${emailTemplate}
        `);
        await sendgridEmail({
          email,
          bcc: infraEmail,
          supportAddr,
          sendgridTemplateId,
          sendgridApiKey,
          subject: "Account Disabled",
          preheader: `Your ${frontendDomain} account has been disabled. You reached your monthly usage limit.`,
          buttonText: "Appeal",
          buttonUrl: frontendUrl(req, "/contact"),
          unsubscribe: unsubscribeUrl(req),
          text: suspensionEmailText("disabled"),
        });
      } catch (err) {
        logger.error(
          `error sending disabled email to user=${email} err=${err}`,
        );
      }
    }

    res.status(204);
    res.end();
  },
);

app.patch("/:id", authorizer({ anyAdmin: true }), async (req, res) => {
  const { id } = req.params;
  const { directPlayback, viewerLimit } = req.body;

  const updateDoc = {};
  if (typeof directPlayback !== "undefined") {
    updateDoc["directPlayback"] = directPlayback;
  }
  if (typeof viewerLimit !== "undefined") {
    updateDoc["viewerLimit"] = viewerLimit;
  }

  if (Object.keys(updateDoc).length !== 0) {
    await db.user.update(id, updateDoc);
  }

  res.status(204).end();
});

app.post("/token", validatePost("user"), async (req, res) => {
  const user = await findUserByEmail(req.body.email);
  const [hashedPassword] = await hash(req.body.password, user.salt);
  if (hashedPassword !== user.password) {
    res.status(403);
    res.json({ errors: ["Password incorrect"] });
    return;
  }

  if (user.suspended) {
    res.status(403);
    return res.json({ errors: ["user is suspended"] });
  }

  const token = signUserJwt(user.id, req.config);
  const refreshToken = uuid();

  await db.jwtRefreshToken.create({
    id: refreshToken,
    userId: user.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + req.config.jwtRefreshTokenTtl * 1000,
  });

  let isTest =
    process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";

  if (
    req.config.requireEmailVerification &&
    !user.emailValid &&
    !user.admin &&
    !isTest &&
    user.createdAt > EMAIL_VERIFICATION_CUTOFF_DATE
  ) {
    // Resend the verification email
    await sendVerificationEmail(req, user, user.stripeProductId);
    res.status(403);
    return res.json({
      errors: [
        "This account has not been verified - please check your inbox for a verification email.",
      ],
    });
  }

  if (!user.defaultProjectId) {
    const project = await createDefaultProject(user.id);

    await db.user.update(user.id, {
      defaultProjectId: project.id,
    });
  }

  res.status(201);
  res.json({ id: user.id, email: user.email, token, refreshToken });
});

app.post(
  "/token/refresh",
  validatePost("refresh-token-payload"),
  async (req, res) => {
    const now = Date.now();
    const { refreshToken } = req.body as RefreshTokenPayload;
    const refreshTokenObj = await db.jwtRefreshToken.get(refreshToken);
    if (
      !refreshTokenObj ||
      refreshTokenObj.expiresAt < now ||
      refreshTokenObj.revoked
    ) {
      console.log(
        `Refresh attempt with invalid refresh token=${refreshToken} expiresAt=${refreshTokenObj?.expiresAt} revoked=${refreshTokenObj?.revoked}`,
      );
      return res.status(401).json({ errors: ["invalid refresh token"] });
    }

    const timeSinceLastRefresh = now - refreshTokenObj.lastSeen;
    const minReuseDelay =
      req.config.jwtAccessTokenTtl * 1000 * REFRESH_TOKEN_MIN_REUSE_DELAY_RATIO;
    if (timeSinceLastRefresh < minReuseDelay) {
      console.log(
        `Revoking token due to potential malicious use of refreshToken=${refreshToken}`,
      );
      await db.jwtRefreshToken.update(refreshToken, {
        revoked: true,
      });
      return res
        .status(401)
        .json({ errors: ["refresh token has already been used too recently"] });
    }

    const user = await db.user.get(refreshTokenObj.userId);
    if (user.suspended) {
      return res.status(403).json({ errors: ["user is suspended"] });
    }

    const token = signUserJwt(user.id, req.config);

    let newRefreshToken: string;
    const fullTokenTtl = refreshTokenObj.expiresAt - refreshTokenObj.createdAt;
    if (
      refreshTokenObj.expiresAt - now <
      fullTokenTtl * REFRESH_TOKEN_REFRESH_THRESHOLD
    ) {
      // issue a new token and revoke the old one if it's close to expiring
      await db.jwtRefreshToken.update(refreshToken, {
        lastSeen: now,
        revoked: true,
      });

      newRefreshToken = uuid();
      await db.jwtRefreshToken.create({
        id: newRefreshToken,
        userId: user.id,
        createdAt: now,
        expiresAt: now + req.config.jwtRefreshTokenTtl * 1000,
      });
    } else {
      // otherwise just update the lastSeen
      await db.jwtRefreshToken.update(refreshToken, {
        lastSeen: now,
      });
    }

    res.status(201);
    res.json({ token, refreshToken: newRefreshToken });
  },
);

// Utility to migrate from the never-expiring JWTs from the dashboard to
// separate access and refresh tokens.
// TODO: Remove this after the cut-off date when these JWTs won't be valid anymore.
app.post(
  "/token/migrate",
  authorizer({ noApiToken: true }),
  async (req, res) => {
    if (!req.isNeverExpiringJWT) {
      return res.status(400).json({
        errors: ["can only migrate from never-expiring JWTs"],
      });
    }

    const token = signUserJwt(req.user.id, req.config);

    const now = Date.now();
    const { id: newRefreshToken } = await db.jwtRefreshToken.create({
      id: uuid(),
      userId: req.user.id,
      createdAt: now,
      expiresAt: now + req.config.jwtRefreshTokenTtl * 1000,
    });

    res.status(201);
    res.json({ token, refreshToken: newRefreshToken });
  },
);

app.post("/verify", validatePost("user-verification"), async (req, res) => {
  let user = await findUserByEmail(req.body.email);
  if (user.emailValidToken === req.body.emailValidToken) {
    // alert sales of new verified user
    const { supportAddr, sendgridTemplateId, sendgridApiKey } = req.config;

    if (req.headers.host.includes("livepeer.studio")) {
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
          buttonUrl: frontendUrl(req, "/dashboard/login"),
          unsubscribe: unsubscribeUrl(req),
          text: [
            `User ${user.email} has signed up and verified their email with Livepeer!`,
          ].join("\n\n"),
        });
      } catch (err) {
        logger.error(`error sending email to ${salesEmail}: error: ${err}`);
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

// resend verify email
app.post("/verify-email", validatePost("verify-email"), async (req, res) => {
  const { selectedPlan } = req.query;
  let user = await findUserByEmail(req.body.email);

  if (!user) {
    let [newEmailUser] = await db.user.find({ newEmail: req.body.email });
    if (newEmailUser.length > 0) {
      user = newEmailUser[0];
    }
  }

  if (!user) {
    res.status(404);
    return res.json({ errors: ["Account not found"] });
  }

  const emailSent = await sendVerificationEmail(req, user, selectedPlan);

  res.status(200).json({ emailSent });
});

async function sendVerificationEmail(req: Request, user: User, selectedPlan) {
  const { email, emailValidToken } = user;

  const emailValid = validator.validate(email);
  if (emailValid || req.user.admin) {
    const {
      supportAddr,
      sendgridTemplateId,
      sendgridApiKey,
      sendgridValidationApiKey,
    } = req.config;

    try {
      // This is a test of the Sendgrid email validation API. Remove this
      // if we decide not to use it and revert to more basic Sendgrid plan.
      sendgridValidateEmail(email, sendgridValidationApiKey);
      // send email verification message to user using SendGrid
      await sendgridEmail({
        email,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
        subject: "Verify your Livepeer Studio Email",
        preheader: "Welcome to Livepeer Studio!",
        buttonText: "Verify Email",
        buttonUrl: frontendUrl(
          req,
          `/dashboard/verify?${qs.stringify({
            email,
            emailValidToken,
            selectedPlan,
          })}`,
        ),
        unsubscribe: unsubscribeUrl(req),
        text: [
          "Please verify your email address to ensure that you can change your password or receive updates from us.",
        ].join("\n\n"),
      });
      return true;
    } catch (err) {
      return false;
    }
  }
}

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

    const userResp = await db.user.get(user.id);
    res.status(200).json(cleanUserFields(userResp));
  },
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
      await sendgridEmail({
        email,
        supportAddr,
        sendgridTemplateId,
        sendgridApiKey,
        subject: "Livepeer Password Reset",
        preheader: "Reset your Livepeer Password!",
        buttonText: "Reset Password",
        buttonUrl: frontendUrl(
          req,
          `/dashboard/reset-password?${qs.stringify({ email, resetToken })}`,
        ),
        unsubscribe: unsubscribeUrl(req),
        text: [
          "Let's change your password so you can log into Livepeer Studio.",
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
      await db.passwordResetToken.get(id),
    );
    if (newToken) {
      res.status(201);
      res.json({});
    } else {
      res.status(403);
      res.json({ errors: ["error creating password reset token"] });
    }
  },
);

app.post(
  "/make-admin",
  authorizer({ admin: true }),
  validatePost("make-admin"),
  async (req, res) => {
    let user = await findUserByEmail(req.body.email);
    await db.user.update(user.id, { admin: req.body.admin });
    user = await db.user.get(user.id);
    res.status(200).json(cleanUserFields(user, req.user.admin));
  },
);

app.post(
  "/create-customer",
  requireStripe(),
  validatePost("create-customer"),
  async (req, res) => {
    const { email } = req.body as CreateCustomer;
    let user = await findUserByEmail(email, false);

    let customer: Stripe.Customer;
    if (user.stripeCustomerId) {
      customer = await req.stripe.customers
        .retrieve(user.stripeCustomerId)
        .then((c) => (c.deleted !== true ? c : null));
    }

    if (!customer) {
      logger.warn(
        `deprecated /create-customer API used. userEmail=${user.email} createdAt=${user.createdAt}`,
      );
      customer = await getOrCreateCustomer(req.stripe, email);
      await db.user.update(user.id, {
        stripeCustomerId: customer.id,
      });
      res.status(201);
      res.json(customer);
    } else {
      res.status(400);
      res.json({ errors: ["error creating customer"] });
    }
  },
);

app.post(
  "/update-customer-payment-method",
  authorizer({ noApiToken: true }),
  validatePost("update-customer-payment-method"),
  requireStripe(),
  async (req, res) => {
    const [users] = await db.user.find(
      { stripeCustomerId: req.body.stripeCustomerId },
      { useReplica: false },
    );
    if (users.length < 1 || users[0].id !== req.user.id) {
      res.status(404);
      return res.json({ errors: ["Account not found"] });
    }
    let user = users[0];

    const paymentMethod = await req.stripe.paymentMethods.attach(
      req.body.stripeCustomerPaymentMethodId,
      {
        customer: req.body.stripeCustomerId,
      },
    );

    const customer = await req.stripe.customers.update(
      req.body.stripeCustomerId,
      {
        invoice_settings: {
          default_payment_method: req.body.stripeCustomerPaymentMethodId,
        },
      },
    );

    // Update user's payment method
    await db.user.update(user.id, {
      stripeCustomerPaymentMethodId: req.body.stripeCustomerPaymentMethodId,
      ccLast4: paymentMethod.card.last4,
      ccBrand: paymentMethod.card.brand,
    });
    res.json(customer);
  },
);

app.post(
  "/create-subscription",
  validatePost("create-subscription"),
  requireStripe(),
  async (req, res) => {
    const { stripeCustomerId, stripeProductId, stripeCustomerPaymentMethodId } =
      req.body as CreateSubscription;
    const [users] = await db.user.find(
      { stripeCustomerId: stripeCustomerId },
      { useReplica: false },
    );
    if (users.length < 1) {
      res.status(404);
      return res.json({ errors: ["Account not found"] });
    }
    let user = users[0];
    if (user.stripeCustomerSubscriptionId) {
      const subscription = await req.stripe.subscriptions.retrieve(
        user.stripeCustomerSubscriptionId,
      );
      return res.send(subscription);
    }
    logger.warn(
      `deprecated /create-subscription API used. userEmail=${user.email} createdAt=${user.createdAt}`,
    );

    // Attach the payment method to the customer if it exists (free plan doesn't require payment)
    if (stripeCustomerPaymentMethodId) {
      logger.warn(
        `attaching payment method through /create-subscription. userEmail=${user.email} createdAt=${user.createdAt}`,
      );
      try {
        const paymentMethod = await req.stripe.paymentMethods.attach(
          stripeCustomerPaymentMethodId,
          {
            customer: stripeCustomerId,
          },
        );
        // Update user's payment method
        await db.user.update(user.id, {
          stripeCustomerPaymentMethodId: stripeCustomerPaymentMethodId,
          ccLast4: paymentMethod.card.last4,
          ccBrand: paymentMethod.card.brand,
        });
      } catch (error) {
        return res.status(402).send({ errors: [error.message] });
      }

      // Change the default invoice settings on the customer to the new payment method
      await req.stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: stripeCustomerPaymentMethodId,
        },
      });
    }

    // Create the subscription
    const subscription = await createSubscription(
      req.stripe,
      stripeProductId,
      stripeCustomerId,
      false,
    );
    if (!subscription) {
      return res
        .status(400)
        .send({ errors: ["could not create subscription"] });
    }

    // Update user's product and subscription id in our db
    await db.user.update(user.id, {
      stripeProductId,
      stripeCustomerSubscriptionId: subscription.id,
    });
    res.send(subscription);
  },
);

app.post(
  "/update-subscription",
  authorizer({ noApiToken: true }),
  validatePost("update-subscription"),
  requireStripe(),
  async (req, res) => {
    const payload = req.body as UpdateSubscription;
    const [users] = await db.user.find(
      { stripeCustomerId: payload.stripeCustomerId },
      { useReplica: false },
    );
    if (
      users.length < 1 ||
      users[0].stripeCustomerId !== payload.stripeCustomerId
    ) {
      res.status(404);
      return res.json({ errors: ["Account not found"] });
    }
    let user = users[0];

    // Attach the payment method to the customer if it exists (free plan doesn't require payment)
    if (payload.stripeCustomerPaymentMethodId) {
      try {
        const paymentMethod = await req.stripe.paymentMethods.attach(
          payload.stripeCustomerPaymentMethodId,
          {
            customer: payload.stripeCustomerId,
          },
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
      payload.stripeCustomerSubscriptionId,
    );

    // Get the prices associated with the subscription
    const subscriptionItems = await req.stripe.subscriptionItems.list({
      subscription: payload.stripeCustomerSubscriptionId,
    });

    let updatedSubscription;
    if (products[payload.stripeProductId].deprecated) {
      // Update the customer's subscription plan.
      // Stripe will automatically invoice the customer based on its usage up until this point
      updatedSubscription = await req.stripe.subscriptions.update(
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
        },
      );
    } else {
      let payAsYouGoItems = [];
      if (products[payload.stripeProductId]?.payAsYouGo) {
        // Get the prices for the pay as you go product
        const payAsYouGoPrices = await req.stripe.prices.list({
          lookup_keys: products["pay_as_you_go_1"].lookupKeys,
        });

        // Map the prices to the additional items array
        payAsYouGoItems = payAsYouGoPrices.data.map((item) => ({
          price: item.id,
        }));
      }
      updatedSubscription = await req.stripe.subscriptions.update(
        payload.stripeCustomerSubscriptionId,
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
        },
      );
    }

    if (
      products[payload.stripeProductId].name == "Growth" ||
      products[payload.stripeProductId].name == "Scale"
    ) {
      await db.user.update(user.id, {
        disabled: false,
      });
    }

    // Update user's product subscription in our db
    await db.user.update(user.id, {
      stripeProductId: payload.stripeProductId,
      planChangedAt: Date.now(),
    });
    res.send(updatedSubscription);
  },
);

app.post(
  "/retrieve-subscription",
  authorizer({ noApiToken: true }),
  requireStripe(),
  async (req, res) => {
    let { stripeCustomerSubscriptionId } = req.body;
    if (
      req.user.stripeCustomerSubscriptionId !== stripeCustomerSubscriptionId
    ) {
      return res.status(403).json({ errors: ["access forbidden"] });
    }
    const subscription = await req.stripe.subscriptions.retrieve(
      stripeCustomerSubscriptionId,
    );
    res.status(200).json(subscription);
  },
);

app.post(
  "/retrieve-invoices",
  authorizer({ noApiToken: true }),
  requireStripe(),
  async (req, res) => {
    let { stripeCustomerId } = req.body;
    if (req.user.stripeCustomerId !== stripeCustomerId) {
      return res.status(403).json({ errors: ["access forbidden"] });
    }
    const invoices = await req.stripe.invoices.list({
      customer: stripeCustomerId,
    });
    res.status(200).json(invoices);
  },
);

app.post(
  "/retrieve-upcoming-invoice",
  authorizer({ noApiToken: true }),
  requireStripe(),
  async (req, res) => {
    let { stripeCustomerId } = req.body;
    if (req.user.stripeCustomerId !== stripeCustomerId) {
      return res.status(403).json({ errors: ["access forbidden"] });
    }

    let subscriptionItems = await req.stripe.subscriptionItems.list({
      subscription: req.user.stripeCustomerSubscriptionId,
    });

    const invoices = await req.stripe.invoices.retrieveUpcoming({
      customer: stripeCustomerId,
    });

    res.status(200).json({
      invoices,
      subscriptionItems,
    });
  },
);

app.post(
  "/retrieve-payment-method",
  authorizer({ noApiToken: true }),
  requireStripe(),
  async (req, res) => {
    let { stripePaymentMethodId } = req.body;
    if (req.user.stripeCustomerPaymentMethodId !== stripePaymentMethodId) {
      return res.status(403).json({ errors: ["access forbidden"] });
    }
    const paymentMethod = await req.stripe.paymentMethods.retrieve(
      stripePaymentMethodId,
    );
    res.status(200).json(paymentMethod);
  },
);

export default app;
