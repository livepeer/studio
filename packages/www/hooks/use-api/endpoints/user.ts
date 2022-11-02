import jwt from "jsonwebtoken";
import qs from "qs";
import {
  Error as ApiError,
  SuspendUserPayload,
  User,
} from "@livepeer.studio/api";
import { isDevelopment } from "../../../lib/utils";
import { ApiState, UsageData } from "../types";
import { getCursor } from "../helpers";
import { SetStateAction } from "react";
import { storeToken, clearToken } from "../tokenStorage";
import { trackPageView } from "../tracking";
import { products } from "@livepeer.studio/api/src/config";

const hasStripe = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const makeUserEndpointsFunctions = (
  context: any,
  state: ApiState,
  setState: (value: SetStateAction<ApiState>) => void
) => ({
  async login(email, password) {
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
    const { token } = body;
    storeToken(token);

    if (process.env.NODE_ENV === "production") {
      const data = jwt.decode(token, { json: true });
      window.analytics.identify(data.sub, { email });
    }

    setState((state) => ({ ...state, token }));
    return res;
  },

  async register({
    email,
    password,
    selectedPlan = 0,
    firstName = null,
    lastName = null,
    phone = null,
    organization = null,
    recaptchaToken,
  }) {
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

    // Only create stripe customer if developer explicitly enables stripe in dev mode
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.NEXT_PUBLIC_STRIPE_ENABLED_IN_DEV_MODE
    ) {
      return context.login(email, password);
    }

    // Create stripe customer
    const customer = await context.createCustomer(email);

    // Subscribe customer to free plan upon registation
    await context.createSubscription({
      stripeCustomerId: customer.id,
      stripeProductId: "prod_0",
    });

    return context.login(email, password);
  },

  async verify(email, emailValidToken) {
    trackPageView(email);
    const [res, body] = await context.fetch("/user/verify", {
      method: "POST",
      body: JSON.stringify({ email, emailValidToken }),
      headers: {
        "content-type": "application/json",
      },
    });

    setState({ ...state, userRefresh: Date.now() });

    if (res.status !== 201) {
      throw new Error(body.errors[0]);
    }
  },

  // resend verify email
  async verifyEmail(email) {
    const [res, body] = await context.fetch("/user/verify-email", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "content-type": "application/json",
      },
    });

    return body;
  },

  async makePasswordResetToken(email) {
    trackPageView(email);
    const [res, body] = await context.fetch("/user/password/reset-token", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "content-type": "application/json",
      },
    });
    return body;
  },

  async resetPassword(email, resetToken, password) {
    trackPageView(email);
    const [res, body] = await context.fetch("/user/password/reset", {
      method: "POST",
      body: JSON.stringify({ email, resetToken, password }),
      headers: {
        "content-type": "application/json",
      },
    });
    if (res.status !== 201) {
      return body;
    }
    return context.login(email, password);
  },

  async getUser(userId, opts = {}): Promise<[Response, User | ApiError]> {
    let [res, user] = await context.fetch(`/user/${userId}`, opts);
    if (isDevelopment() && hasStripe && !user.stripeProductId && user.email) {
      const customer = await context.createCustomer(user.email);
      await context.createSubscription({
        stripeCustomerId: customer.id,
        stripeProductId: "prod_0",
      });
      [res, user] = await context.fetch(`/user/${userId}`, opts);
    }
    return [res, user as User | ApiError];
  },

  // Get current Stripe product, allowing for development users that don't have any
  getUserProduct(user: User) {
    if (hasStripe) {
      return products[user.stripeProductId];
    }
    return products[user.stripeProductId || "prod_0"];
  },

  async getUsers(
    limit = 100,
    cursor?: string,
    order?: string,
    filters?: Array<{ id: string; value: string }>
  ): Promise<[Array<User> | ApiError, string, Response]> {
    const f = filters ? JSON.stringify(filters) : undefined;
    const uri = `/user?${qs.stringify({ limit, cursor, filters: f, order })}`;
    let [res, users] = await context.fetch(uri);

    const nextCursor = getCursor(res.headers.get("link"));
    return [users, nextCursor, res];
  },

  async getUsage(
    fromTime: number,
    toTime: number,
    userId?: number
  ): Promise<[Response, UsageData | ApiError]> {
    let [res, usage] = await context.fetch(
      `/user/usage?${qs.stringify({ fromTime, toTime, userId })}`,
      {}
    );

    return [res, usage as UsageData | ApiError];
  },

  async makeUserAdmin(email, admin): Promise<[Response, User | ApiError]> {
    const [res, body] = await context.fetch("/user/make-admin", {
      method: "POST",
      body: JSON.stringify({ email: email, admin: admin }),
      headers: {
        "content-type": "application/json",
      },
    });

    setState({ ...state, userRefresh: Date.now() });

    if (res.status !== 201) {
      return body;
    }

    return res;
  },

  async setUserSuspended(
    userId: string,
    payload: SuspendUserPayload
  ): Promise<[Response, ApiError]> {
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
  },

  async createCustomer(email): Promise<{ id: string } | ApiError> {
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
  },

  async createSubscription({
    stripeCustomerId,
    stripeProductId,
  }): Promise<User | ApiError> {
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
    setState({ ...state, userRefresh: Date.now() });

    if (res.status !== 201) {
      return body;
    }

    return res;
  },

  async updateSubscription({
    stripeCustomerId,
    stripeCustomerSubscriptionId,
    stripeProductId,
    stripeCustomerPaymentMethodId = null,
  }): Promise<[Response, User | ApiError]> {
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
    setState({ ...state, userRefresh: Date.now() });

    if (res.status !== 201) {
      return body;
    }

    return res;
  },

  async getSubscription(
    stripeCustomerSubscriptionId: string
  ): Promise<[Response, ApiError]> {
    let [res, subscription] = await context.fetch(
      `/user/retrieve-subscription`,
      {
        method: "POST",
        body: JSON.stringify({
          stripeCustomerSubscriptionId,
        }),
        headers: {
          "content-type": "application/json",
        },
      }
    );

    return [res, subscription];
  },

  async getInvoices(stripeCustomerId: string): Promise<[Response, ApiError]> {
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
  },

  async getPaymentMethod(
    stripePaymentMethodId: string
  ): Promise<[Response, PaymentMethodData | ApiError]> {
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
  },

  async updateCustomerPaymentMethod({
    stripeCustomerId,
    stripeCustomerPaymentMethodId,
  }): Promise<[Response, User | ApiError]> {
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

    setState({ ...state, userRefresh: Date.now() });

    if (res.status !== 201) {
      return body;
    }

    return res;
  },

  async logout() {
    setState((state) => ({ ...state, user: null, token: null }));
    clearToken();
  },
});

export default makeUserEndpointsFunctions;
