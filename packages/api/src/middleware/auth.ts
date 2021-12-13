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

type AuthTokenType = "jwt" | "bearer" | "basic";

function parseAuthToken(authToken: string) {
  const match = authToken?.match(/^\s+(\w+)\s+(.+)$/);
  if (!match) return {};
  return {
    rawTokenType: match[1],
    tokenType: match[1].trim().toLowerCase() as AuthTokenType,
    tokenValue: match[2].trim(),
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
    const authToken = req.headers.authorization;
    const { tokenType, tokenValue, rawTokenType } = parseAuthToken(authToken);
    const basicUser = basicAuth.parse(authToken);
    let user: User;
    let tokenObject: WithID<ApiToken>;
    let userId: string;

    if (!tokenType) {
      throw new ForbiddenError(`no authorization header provided`);
    } else if (["bearer", "basic"].includes(tokenType) && !params.noApiToken) {
      const isBasic = tokenType === "basic";
      const tokenId = isBasic ? basicUser?.pass : req.token;
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
    } else if (tokenType === "jwt") {
      try {
        const verified = jwt.verify(tokenValue, req.config.jwtSecret, {
          audience: req.config.jwtAudience,
        }) as JwtPayload;
        userId = verified.sub;
        tracking.recordUser(db, userId);
      } catch (err) {
        throw new ForbiddenError(err.message);
      }
    } else {
      throw new ForbiddenError(
        `unsupported authorization type: ${rawTokenType}`
      );
    }

    user = await db.user.get(userId);
    if (!user) {
      throw new InternalServerError(`no user found for token ${authToken}`);
    }
    if (user.suspended) {
      throw new ForbiddenError(`user is suspended`);
    }

    if (
      (req.config.requireEmailVerification || !params.allowUnverified) &&
      user.emailValid === false
    ) {
      throw new ForbiddenError(
        `useremail ${user.email} has not been verified. Please check your inbox for verification email.`
      );
    }

    // UI admins must have a JWT
    const isUIAdmin = user.admin && tokenType === "jwt";
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
