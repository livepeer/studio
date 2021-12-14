import { URL } from "url";
import basicAuth from "basic-auth";
import { RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { pathJoin2, trimPathPrefix } from "../controllers/helpers";
import { ApiToken, User } from "../schema/types";
import { db } from "../store";
import { InternalServerError, ForbiddenError } from "../store/errors";
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

interface AuthParams {
  allowUnverified?: boolean;
  admin?: boolean;
  anyAdmin?: boolean;
  noApiToken?: boolean;
  originalUriHeader?: string;
}

/**
 * creates an authentication middleware that can be customized.
 * @param {Object} params auth middleware params, to be defined later
 */
function authFactory(params: AuthParams): RequestHandler {
  return async (req, res, next) => {
    // must have either an API key (starts with 'Bearer') or a JWT token
    const authHeader = req.headers.authorization;
    const { authScheme, authToken, rawAuthScheme } =
      parseAuthHeader(authHeader);
    const basicUser = basicAuth.parse(authHeader);
    let user: User;
    let tokenObject: WithID<ApiToken>;
    let userId: string;

    if (!authScheme) {
      throw new ForbiddenError(`no authorization header provided`);
    } else if (["bearer", "basic"].includes(authScheme) && !params.noApiToken) {
      const isBasic = authScheme === "basic";
      const tokenId = isBasic ? basicUser?.pass : authToken;
      if (!tokenId) {
        throw new ForbiddenError(`no authorization token provided`);
      }
      tokenObject = await db.apiToken.get(tokenId);
      const matchesBasicUser = tokenObject?.userId === basicUser?.name;
      if (!tokenObject || (isBasic && !matchesBasicUser)) {
        throw new ForbiddenError(`no token ${tokenId} found`);
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
        throw new ForbiddenError(err.message);
      }
    } else {
      throw new ForbiddenError(
        `unsupported authorization header scheme: ${rawAuthScheme}`
      );
    }

    user = await db.user.get(userId);
    if (!user) {
      throw new InternalServerError(
        `no user found from authorization header: ${authHeader}`
      );
    }
    if (user.suspended) {
      throw new ForbiddenError(`user is suspended`);
    }

    const verifyEmail =
      req.config.requireEmailVerification && !params.allowUnverified;
    if (verifyEmail && !user.emailValid) {
      throw new ForbiddenError(
        `useremail ${user.email} has not been verified. Please check your inbox for verification email.`
      );
    }

    // UI admins must have a JWT
    const isUIAdmin = user.admin && authScheme === "jwt";
    if ((params.admin && !isUIAdmin) || (params.anyAdmin && !user.admin)) {
      throw new ForbiddenError(`user does not have admin priviledges`);
    }
    const accessRules = tokenObject?.access?.rules;
    if (accessRules) {
      let fullPath = pathJoin2(req.baseUrl, req.path);
      let { httpPrefix } = req.config;
      if (params.originalUriHeader) {
        const header = req.headers[params.originalUriHeader];
        const originalUri = new URL(header?.toString() ?? "");
        fullPath = originalUri.pathname;
        httpPrefix = null;
      }
      if (!isAuthorized(req.method, fullPath, accessRules, httpPrefix)) {
        throw new ForbiddenError(`credential has insufficent privileges`);
      }
    }

    req.user = user;
    req.isUIAdmin = isUIAdmin;
    if (tokenObject && tokenObject.name) {
      req.tokenName = tokenObject.name;
    }
    if (tokenObject && tokenObject.id) {
      req.tokenId = tokenObject.id;
    }
    return next();
  };
}

// export default router
export default authFactory;
