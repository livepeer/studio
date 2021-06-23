import basicAuth from "basic-auth";
import jwt from "jsonwebtoken";

import { db } from "../store";
import { InternalServerError, ForbiddenError } from "../store/errors";
import tracking from "./tracking";

function parseAuthToken(authToken) {
  const match = authToken?.match(/^(\w+) +(.+)$/);
  if (!match) return {};
  return { tokenType: match[1], tokenValue: match[2] };
}

/**
 * creates an authentication middleware that can be customized.
 * @param {Object} params auth middleware params, to be defined later
 */
function authFactory(params) {
  return async (req, res, next) => {
    // must have either an API key (starts with 'Bearer') or a JWT token
    const authToken = req.headers.authorization;
    const { tokenType, tokenValue } = parseAuthToken(authToken);
    const basicUser = basicAuth.parse(authToken);
    let user;
    let tokenObject;
    let userId;

    if (!tokenType) {
      throw new ForbiddenError(`no authorization header provided`);
    } else if (["Bearer", "Basic"].includes(tokenType)) {
      const isBasic = tokenType === "Basic";
      const tokenId = isBasic ? basicUser?.pass : req.token;
      if (!tokenId) {
        throw new ForbiddenError(`no authorization token provided`);
      }
      tokenObject = await db.apiToken.get(tokenId);
      const matchesBasicUser = tokenObject?.userId === basicUser?.name;
      if (!tokenObject || (isBasic && !matchesBasicUser)) {
        throw new ForbiddenError(`no token object ${tokenValue} found`);
      }

      userId = tokenObject.userId;
      // track last seen
      tracking.recordToken(db, tokenObject);
    } else if (tokenType === "JWT") {
      try {
        const verified = jwt.verify(tokenValue, req.config.jwtSecret, {
          audience: req.config.jwtAudience,
        });
        userId = verified.sub;
        tracking.recordUser(db, userId);
      } catch (err) {
        throw new ForbiddenError(err.message);
      }
    } else {
      throw new ForbiddenError(`unsupported authorization type ${tokenType}`);
    }

    user = await req.store.get(`user/${userId}`);

    if (!user) {
      throw new InternalServerError(`no user found for token ${authToken}`);
    }

    if (user.suspended) {
      throw new ForbiddenError(`user is suspended`);
    }

    if (!params.allowUnverified && user.emailValid === false) {
      throw new ForbiddenError(
        `useremail ${user.email} has not been verified. Please check your inbox for verification email.`
      );
    }

    req.user = user;
    req.authTokenType = tokenType;
    req.isUIAdmin = req.user.admin && tokenType === "JWT";
    if (tokenObject && tokenObject.name) {
      req.tokenName = tokenObject.name;
    }
    if (tokenObject && tokenObject.id) {
      req.tokenId = tokenObject.id;
    }

    if (params.admin) {
      // admins must have a JWT
      if (
        (tokenType === "JWT" && user.admin !== true) ||
        tokenType === "Bearer"
      ) {
        throw new ForbiddenError(`user does not have admin priviledges`);
      }
    }

    if (params.anyAdmin) {
      if (user.admin !== true) {
        throw new ForbiddenError(`user does not have admin priviledges`);
      }
    }
    return next();
  };
}

// export default router
export default authFactory;
