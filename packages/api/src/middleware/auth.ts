import { Handler, Express, Request, Response, NextFunction } from "express";
import { unless } from "express-unless";
import { GetVerificationKey, expressjwt as jwt } from "express-jwt";
import { Algorithm } from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import jwtAuthz from "express-jwt-authz";

import { env, constants } from "../utils";

const { apiRoutes } = constants;

export type User = {
  sub?: string;
  permissions?: string[];
  scope?: string;
  iat?: number;
  exp?: number;
};

export const Auth0Permissions = [
  "pfpro:manage",
  "pfpro:read",
  "pfpro:write",
  "statistics:read",
  "public:read",
];

export default (app: Express) => {
  const audience = env.AUTH0_AUDIENCE.endsWith("/")
    ? env.AUTH0_AUDIENCE.replace(/\/$/, "") // Removes the trailing forward slash
    : env.AUTH0_AUDIENCE;

  const authConfig = {
    audience,
    issuer: `https://${env.AUTH0_DOMAIN}/`,
    algorithms: ["RS256"] as Algorithm[],
  };

  const secret = jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }) as GetVerificationKey;

  const authN = jwt({
    secret,
    ...authConfig,
  });

  interface ConditionalHandler extends Handler {
    unless: typeof unless;
  }

  function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
    if (req.headers["api-key"] !== env.API_KEY) {
      return res.sendStatus(401);
    }
    next();
  }

  apiKeyAuth.unless = unless;

  const authZ = jwtAuthz(Auth0Permissions, {
    customScopeKey: "permissions",
    failWithError: true,
    customUserKey: "auth",
  }) as ConditionalHandler;

  authZ.unless = unless;

  const useApiKeyAuth = (req: Request) => !req.headers.authorization;
  const useJWTAuth = (req: Request): boolean => !req.headers["api-key"];
  const useGoogleDriveAuth = (req: Request): boolean =>
    req.path.indexOf("/drive") != -1 ||
    req.path.indexOf("/connect/google") != -1 ||
    req.path.indexOf("/api") != -1;

  const checkAuthHeaders = (req: Request, res: Response, next: NextFunction) => {
    if (useApiKeyAuth(req) && useJWTAuth(req)) {
      return res.sendStatus(401);
    }
    next();
  };

  app.use(
    apiRoutes.graphql,
    checkAuthHeaders,
    authN.unless(useApiKeyAuth),
    authZ.unless(useApiKeyAuth),
    apiKeyAuth.unless(useJWTAuth),
  );

  app.use(apiRoutes.upload, authN.unless(useGoogleDriveAuth), authZ.unless(useGoogleDriveAuth));
};
