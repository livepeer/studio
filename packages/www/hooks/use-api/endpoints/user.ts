import jwt from "jsonwebtoken";
import qs from "qs";
import {
  Error as ApiError,
  SuspendUserPayload,
  User,
} from "@livepeer.studio/api";
import { isDevelopment, shouldStripe } from "../../../lib/utils";
import {
  ApiState,
  UsageData,
  BillingUsageData,
  UpcomingInvoice,
} from "../types";
import { getCursor } from "../helpers";
import { SetStateAction } from "react";
import { storeToken, clearTokens } from "../tokenStorage";
import { trackPageView } from "../tracking";
import { products } from "@livepeer.studio/api/src/config";

const hasStripe = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let context: any;
let setState: (value: SetStateAction<ApiState>) => void;

export const setSharedScope = (
  _context: any,
  _setState: (value: SetStateAction<ApiState>) => void
) => {
  context = _context;
  setState = _setState;
};

export const login = async (email, password) => {
  trackPageView(email);
  const [res, body] = await context.fetch("/user/token", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: {
      "content-type": "application/json",
    },
  });
  if (res.status !== 201) {
    return body;
  }
  const { token, refreshToken } = body;
  storeToken(token, refreshToken);

  if (process.env.NODE_ENV === "production") {
    const data = jwt.decode(token, { json: true });
    window.analytics && window.analytics.identify(data.sub, { email });
  }

  setState((state) => ({ ...state, token, refreshToken }));
  return res;
};

const inFlight: Record<string, Promise<any>> = {};

// This makes sure a given function is only executed a single time concurrently.
// It is used to prevent multiple concurrent executions of the
// refreshAccessToken function. The result of the function gets re-used for
// every caller, since the same promise is returned.
const singleFlight = <T>(key: string, fn: () => Promise<T>) => {
  const cached = inFlight[key];
  if (cached) {
    return cached as Promise<T>;
  }

  const promise = fn().finally(() => {
    delete inFlight[key];
  });
  inFlight[key] = promise;
  return promise;
};

export const refreshAccessToken = () =>
  singleFlight(`refreshAccessToken`, async () => {
    let {
      endpoint,
      token: legacyJwt,
      refreshToken,
      user: { email = "" } = {},
    } = context;

    let res: Response;
    let baseUrl = `${endpoint}/api/user/token`;
    // any access token stored without a corresponding refresh token is
    // considered legacy. i.e. has no expiration and should be migrated.
    // TODO: Remove this logic after the never-expiring JWTs cut-off date
    if (!refreshToken && legacyJwt) {
      res = await fetch(`${baseUrl}/migrate`, {
        method: "POST",
        headers: {
          authorization: `JWT ${legacyJwt}`,
        },
      });
    } else {
      res = await fetch(`${baseUrl}/refresh`, {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        headers: {
          "content-type": "application/json",
        },
      });
    }
    if (res.status !== 201) {
      return null;
    }

    const { token, refreshToken: newRefreshToken } = await res.json();
    if (newRefreshToken) {
      // allow the refresh token itself to be refreshed if the server sends a new one
      refreshToken = newRefreshToken;
    }
    storeToken(token, refreshToken);

    if (process.env.NODE_ENV === "production") {
      const data = jwt.decode(token, { json: true });
      window.analytics && window.analytics.identify(data.sub, { email });
    }

    setState((state) => ({ ...state, token, refreshToken }));
    return token as string;
  });

export const register = async ({
  email,
  password,
  selectedPlan = 0,
  firstName = null,
  lastName = null,
  phone = null,
  organization = null,
  recaptchaToken,
}) => {
  trackPageView(email);
  const [res, body] = await context.fetch(
    `/user?selectedPlan=${selectedPlan}`,
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(organization && { organization }),
        ...(phone && { phone }),
        recaptchaToken,
      }),
      headers: {
        "content-type": "application/json",
      },
    }
  );
  if (res.status !== 201) {
    return body;
  }

  if (!shouldStripe()) {
    return login(email, password);
  }

  // Create stripe customer
  const customer = await createCustomer(email);

  // Subscribe customer to free plan upon registation
  await createSubscription({
    stripeCustomerId: customer.id,
    stripeProductId: "prod_O9XuIjn7EqYRVW",
  });

  return login(email, password);
};

export const verify = async (email, emailValidToken) => {
  trackPageView(email);
  const [res, body] = await context.fetch("/user/verify", {
    method: "POST",
    body: JSON.stringify({ email, emailValidToken }),
    headers: {
      "content-type": "application/json",
    },
  });

  setState((state) => ({ ...state, userRefresh: Date.now() }));

  if (res.status !== 201) {
    throw new Error(body.errors[0]);
  }
};

export const verifyNewEmail = async (email, emailValidToken) => {
  trackPageView(email);
  const [res, body] = await context.fetch("/user/verify/new-email", {
    method: "POST",
    body: JSON.stringify({ email, emailValidToken }),
    headers: {
      "content-type": "application/json",
    },
  });

  setState((state) => ({ ...state, userRefresh: Date.now() }));

  if (res.status !== 201) {
    throw new Error(body.errors[0]);
  }
};

// resend verify email
export const verifyEmail = async (email) => {
  const [res, body] = await context.fetch("/user/verify-email", {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: {
      "content-type": "application/json",
    },
  });

  return body;
};

export const makePasswordResetToken = async (email) => {
  trackPageView(email);
  const [res, body] = await context.fetch("/user/password/reset-token", {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: {
      "content-type": "application/json",
    },
  });
  return body;
};

export const resetPassword = async (email, resetToken, password) => {
  trackPageView(email);
  const [res, body] = await context.fetch("/user/password/reset", {
    method: "POST",
    body: JSON.stringify({ email, resetToken, password }),
    headers: {
      "content-type": "application/json",
    },
  });
  if (res.status !== 200) {
    return body;
  }
  return login(email, password);
};

export const getUser = async (
  userId,
  opts = {}
): Promise<[Response, User | ApiError]> => {
  let [res, user] = await context.fetch(`/user/${userId}`, opts);
  if (isDevelopment() && hasStripe && !user.stripeProductId && user.email) {
    const customer = await createCustomer(user.email);
    await createSubscription({
      stripeCustomerId: customer.id,
      stripeProductId: "prod_O9XuIjn7EqYRVW",
    });
    [res, user] = await context.fetch(`/user/${userId}`, opts);
  }
  return [res, user as User | ApiError];
};

// Get current Stripe product, allowing for development users that don't have any
export const getUserProduct = (user: User) => {
  if (hasStripe) {
    return products[user.stripeProductId];
  }
  return products[user.stripeProductId] || products["prod_O9XuIjn7EqYRVW"];
};

export const getUsers = async (
  limit = 100,
  cursor?: string,
  order?: string,
  filters?: Array<{ id: string; value: string }>
): Promise<[Array<User> | ApiError, string, Response]> => {
  const f = filters ? JSON.stringify(filters) : undefined;
  const uri = `/user?${qs.stringify({ limit, cursor, filters: f, order })}`;
  let [res, users] = await context.fetch(uri);

  const nextCursor = getCursor(res.headers.get("link"));
  return [users, nextCursor, res];
};

export const getUsage = async (
  fromTime: number,
  toTime: number,
  userId?: number
): Promise<[Response, UsageData | ApiError]> => {
  let [res, usage] = await context.fetch(
    `/user/usage?${qs.stringify({ fromTime, toTime, userId })}`,
    {}
  );

  return [res, usage as UsageData | ApiError];
};

export const getBillingUsage = async (
  fromTime: number,
  toTime: number,
  creatorId?: number,
  timeStep?: string
): Promise<[Response, BillingUsageData | ApiError]> => {
  let [res, usage] = await context.fetch(
    `/data/usage/query?${qs.stringify({
      from: fromTime,
      to: toTime,
      creatorId,
      timeStep,
    })}`,
    {}
  );

  if (!usage) {
    return [
      res,
      {
        TotalUsageMins: 0,
        DeliveryUsageMins: 0,
        StorageUsageMins: 0,
      } as BillingUsageData | ApiError,
    ];
  }

  return [res, usage as BillingUsageData | ApiError];
};

export const getUpcomingInvoice = async (
  stripeCustomerId: string
): Promise<[Response, any | ApiError]> => {
  let [res, invoice] = await context.fetch(`/user/retrieve-upcoming-invoice`, {
    method: "POST",
    body: JSON.stringify({ stripeCustomerId }),
    headers: {
      "content-type": "application/json",
    },
  });

  return [res, invoice as any | ApiError];
};

export const makeUserAdmin = async (
  email,
  admin
): Promise<[Response, User | ApiError]> => {
  const [res, body] = await context.fetch("/user/make-admin", {
    method: "POST",
    body: JSON.stringify({ email: email, admin: admin }),
    headers: {
      "content-type": "application/json",
    },
  });

  setState((state) => ({ ...state, userRefresh: Date.now() }));

  if (res.status !== 201) {
    return body;
  }

  return res;
};

export const setUserSuspended = async (
  userId: string,
  payload: SuspendUserPayload
): Promise<[Response, ApiError]> => {
  const [res, body] = await context.fetch(`/user/${userId}/suspended`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
    },
  });

  if (res.status !== 204) {
    if (body && body.errors) {
      return [res, body];
    }
    return [
      res,
      { errors: [res.body ? `${body}` : `http status ${res.status}`] },
    ];
  }
  return [res, null];
};

export const createCustomer = async (
  email
): Promise<{ id: string } | ApiError> => {
  if (!hasStripe) {
    return;
  }
  const [res, body] = await context.fetch("/user/create-customer", {
    method: "POST",
    body: JSON.stringify({ email: email }),
    headers: {
      "content-type": "application/json",
    },
  });

  return body;
};

export const createSubscription = async ({
  stripeCustomerId,
  stripeProductId,
}): Promise<User | ApiError> => {
  if (!hasStripe) {
    return;
  }
  const [res, body] = await context.fetch("/user/create-subscription", {
    method: "POST",
    body: JSON.stringify({
      stripeCustomerId,
      stripeProductId,
    }),
    headers: {
      "content-type": "application/json",
    },
  });
  setState((state) => ({ ...state, userRefresh: Date.now() }));

  if (res.status !== 201) {
    return body;
  }

  return res;
};

export const updateSubscription = async ({
  stripeCustomerId,
  stripeCustomerSubscriptionId,
  stripeProductId,
  stripeCustomerPaymentMethodId = null,
}): Promise<[Response, User | ApiError]> => {
  const [res, body] = await context.fetch("/user/update-subscription", {
    method: "POST",
    body: JSON.stringify({
      stripeCustomerId,
      stripeCustomerSubscriptionId,
      stripeProductId,
      ...(stripeCustomerPaymentMethodId && {
        stripeCustomerPaymentMethodId,
      }),
    }),
    headers: {
      "content-type": "application/json",
    },
  });
  setState((state) => ({ ...state, userRefresh: Date.now() }));

  if (res.status !== 201) {
    return body;
  }

  return res;
};

export const getSubscription = async (
  stripeCustomerSubscriptionId: string
): Promise<[Response, ApiError]> => {
  let [res, subscription] = await context.fetch(`/user/retrieve-subscription`, {
    method: "POST",
    body: JSON.stringify({
      stripeCustomerSubscriptionId,
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  return [res, subscription];
};

export const getInvoices = async (
  stripeCustomerId: string
): Promise<[Response, ApiError]> => {
  let [res, invoice] = await context.fetch(`/user/retrieve-invoices`, {
    method: "POST",
    body: JSON.stringify({
      stripeCustomerId,
    }),
    headers: {
      "content-type": "application/json",
    },
  });

  return [res, invoice];
};

export const getPaymentMethod = async (
  stripePaymentMethodId: string
): Promise<[Response, PaymentMethodData | ApiError]> => {
  let [res, paymentMethod] = await context.fetch(
    `/user/retrieve-payment-method`,
    {
      method: "POST",
      body: JSON.stringify({
        stripePaymentMethodId,
      }),
      headers: {
        "content-type": "application/json",
      },
    }
  );
  return [res, paymentMethod];
};

export const updateCustomerPaymentMethod = async ({
  stripeCustomerId,
  stripeCustomerPaymentMethodId,
}): Promise<[Response, User | ApiError]> => {
  const [res, body] = await context.fetch(
    "/user/update-customer-payment-method",
    {
      method: "POST",
      body: JSON.stringify({
        stripeCustomerId,
        stripeCustomerPaymentMethodId,
      }),
      headers: {
        "content-type": "application/json",
      },
    }
  );

  setState((state) => ({ ...state, userRefresh: Date.now() }));

  if (res.status !== 201) {
    return body;
  }

  return res;
};

export const logout = async () => {
  setState((state) => ({
    ...state,
    user: null,
    token: null,
    refreshToken: null,
  }));
  clearTokens();
};
