import { URL } from "url";
import basicAuth from "basic-auth";
import { CorsOptions, CorsOptionsDelegate } from "cors";
import { Request, RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { pathJoin2, trimPathPrefix } from "../controllers/helpers";
import { ApiToken, User } from "../schema/types";
import { db } from "../store";
import { ForbiddenError, UnauthorizedError } from "../store/errors";
import { WithID } from "../store/types";
import { AuthRule, AuthPolicy } from "./authPolicy";
import tracking from "./tracking";

type AuthScheme = "jwt" | "bearer" | "basic";

function parseAuthHeader(authHeader: string) {
  const match = authHeader?.match(/^\s*(\w+)\s+(.+)$/);
  if (!match) return {};
  return {
    rawAuthScheme: match[1],
    authScheme: match[1].trim().toLowerCase() as AuthScheme,
    authToken: match[2].trim(),
  };
}

function isAuthorized(
  method: string,
  path: string,
  rules: AuthRule[],
  httpPrefix?: string
) {
  try {
    const policy = new AuthPolicy(rules);
    if (httpPrefix) {
      path = trimPathPrefix(httpPrefix, path);
    }
    return policy.allows(method, path);
  } catch (err) {
    console.error(`error authorizing ${method} ${path}: ${err}`);
    return false;
  }
}

/**
 * Creates a middleware that parses and verifies the authentication method from
 * the request and populates the `express.Request` object.
 *
 * @remarks
 * The only auth method supported is the `Authorization` header. It can use:
 *  * the `Bearer` scheme with an API key (used by external applications);
 *  * the `JWT` scheme with a JWT token (used by the dashboard), or;
 *  * the `Basic` scheme with an `userId` as the username and an API key from
 *    that user as the `password` (used by `go-livepeer` that only supports a
 *    URL to specify some endpoints like the stream auth webhook).
 *
 * @remarks
 * It is supposed to be used as a global middleware that runs for every request
 * and should be used in conjunction with the `authorizer` middleware below.
 *
 * As such it allows requests without any authentication method to pass through.
 * If the specific API requires a user, it must add an {@link authorizer}
 * middleware which will fail if the request is not authenticated.
 */
function authenticator(): RequestHandler {
  return async (req, res, next) => {
    res.vary("Authorization");
    const authHeader = req.headers.authorization;
    const { authScheme, authToken, rawAuthScheme } =
      parseAuthHeader(authHeader);
    const basicUser = basicAuth.parse(authHeader);
    let user: User;
    let tokenObject: WithID<ApiToken>;
    let userId: string;

    if (!authScheme) {
      return next();
    } else if (["bearer", "basic"].includes(authScheme)) {
      const isBasic = authScheme === "basic";
      const tokenId = isBasic ? basicUser?.pass : authToken;
      if (!tokenId) {
        throw new UnauthorizedError(`no authorization token provided`);
      }
      tokenObject = await db.apiToken.get(tokenId);
      const matchesBasicUser = tokenObject?.userId === basicUser?.name;
      if (!tokenObject || (isBasic && !matchesBasicUser)) {
        throw new UnauthorizedError(`no token ${tokenId} found`);
      }

      userId = tokenObject.userId;
      // track last seen
      tracking.recordToken(db, tokenObject);
    } else if (authScheme === "jwt") {
      try {
        const verified = jwt.verify(authToken, req.config.jwtSecret, {
          audience: req.config.jwtAudience,
        }) as JwtPayload;
        userId = verified.sub;
        tracking.recordUser(db, userId);
      } catch (err) {
        throw new UnauthorizedError(err.message);
      }
    } else {
      throw new UnauthorizedError(
        `unsupported authorization header scheme: ${rawAuthScheme}`
      );
    }

    user = await db.user.get(userId);
    if (!user) {
      throw new UnauthorizedError(
        `no user found from authorization header: ${authHeader}`
      );
    }
    if (user.suspended) {
      throw new ForbiddenError(`user is suspended`);
    }

    req.user = user;
    // UI admins must have a JWT
    req.isUIAdmin = user.admin && authScheme === "jwt";
    req.token = tokenObject;
    return next();
  };
}

function corsOptsProvider(params: {
  anyOriginPathPrefixes: string[];
  baseOpts: CorsOptions;
  jwtOrigin: (string | RegExp)[];
}): CorsOptionsDelegate<Request> {
  const { anyOriginPathPrefixes, baseOpts, jwtOrigin } = params;
  const anyOriginOpts = { ...baseOpts, origin: true, credentials: false };
  const jwtOpts = { ...baseOpts, origin: jwtOrigin };
  const getCorsOpts = (req: Request) => {
    const {
      method,
      path,
      headers: { origin: reqOrigin },
      token,
    } = req;
    if (anyOriginPathPrefixes.some((p) => path.startsWith(p))) {
      return anyOriginOpts;
    }
    if (!token && method === "OPTIONS") {
      return {
        ...baseOpts,
        origin: reqOrigin ? [reqOrigin] : true,
      };
    }
    return !token
      ? jwtOpts
      : {
          ...baseOpts,
          origin: token.access?.cors?.allowedOrigins ?? [],
        };
  };

  return (req, callback) => callback(null, getCorsOpts(req));
}

interface AuthzParams {
  allowUnverified?: boolean;
  admin?: boolean;
  anyAdmin?: boolean;
  noApiToken?: boolean;
  originalUriHeader?: string;
  allowCorsApiKey?: boolean;
}

/**
 * Creates a customizable authorization middleware that ensures any access
 * restrictions are met for the request to go through.
 *
 * @remarks
 * This has a strict dependency on the {@link authenticator} middleware above.
 * If that middleware hasn't run in the request before this one, all requests
 * will be rejected.
 */
function authorizer(params: AuthzParams): RequestHandler {
  return async (req, res, next) => {
    const { user, isUIAdmin, token } = req;
    if (!user) {
      throw new UnauthorizedError(`request is not authenticated`);
    }
    if (token && params.noApiToken) {
      throw new ForbiddenError(`access forbidden for API keys`);
    }

    const verifyEmail =
      req.config.requireEmailVerification && !params.allowUnverified;
    if (verifyEmail && !user.emailValid) {
      throw new ForbiddenError(
        `user ${user.email} has not been verified. please check your inbox for verification email.`
      );
    }

    if ((params.admin && !isUIAdmin) || (params.anyAdmin && !user.admin)) {
      throw new ForbiddenError(`user does not have admin priviledges`);
    }
    const access = token?.access;
    if (access?.rules) {
      let fullPath = pathJoin2(req.baseUrl, req.path);
      let { httpPrefix } = req.config;
      if (params.originalUriHeader) {
        const header = req.headers[params.originalUriHeader];
        const originalUri = new URL(header?.toString() ?? "");
        fullPath = originalUri.pathname;
        httpPrefix = null;
      }
      if (!isAuthorized(req.method, fullPath, access?.rules, httpPrefix)) {
        throw new ForbiddenError(`credential has insufficent privileges`);
      }
    } else {
      const cors = access?.cors;
      if (cors && !cors.fullAccess && !params.allowCorsApiKey) {
        throw new ForbiddenError(
          `access forbidden for restricted CORS API tokens`
        );
      }
    }
    return next();
  };
}

export { authenticator, corsOptsProvider, authorizer };
