import { Express, Request, Response } from "express";
import postgraphile, { PostGraphileOptions } from "postgraphile";
import PgSimplifyInflectorPlugin from "@graphile-contrib/pg-simplify-inflector";
import PostgisPlugin from "@graphile/postgis";
import ConnectionFilterPlugin from "postgraphile-plugin-connection-filter";

import { env, extendDebugger } from "../utils";
import { handleGraphQLErrors } from "../utils/errorHandler";
import { ownerConnectionString, authPgPool } from "../database";
import { WrapReolversPlugin, ExtendGqlSchemaPlugin } from "../plugins";
import { User } from "./auth";

const debug = extendDebugger("middleware:postgraphile");

const { isProd, DB_VISITOR_ROLE, DB_AUTHENTICATED_ROLE, DB_ADMIN_ROLE, DB_PARTNER_ROLE } = env;

const schemas: string | string[] = ["pf_public"];

const adminPermissions = ["pfpro:manage", "pfpro:read", "pfpro:write"];
const fullUserPermissions = ["pfpro:read", "pfpro:write"];
const partnerPermissions = ["statistics:read"];
const publicApiUserPermissions = ["public:read"];

const options: PostGraphileOptions<Request, Response> = {
  // This is so that PostGraphile installs the watch fixtures,; it's also needed to enable live queries
  ownerConnectionString,

  /*
   * Plugins to enhance the GraphQL schema, see:
   *   https://www.graphile.org/postgraphile/extending/
   */
  appendPlugins: [
    PgSimplifyInflectorPlugin,
    PostgisPlugin,
    ExtendGqlSchemaPlugin,
    ConnectionFilterPlugin,
    WrapReolversPlugin,
  ],

  handleErrors: handleGraphQLErrors,

  // setofFunctionsContainNulls=false: reduces the number of nulls in your schema
  setofFunctionsContainNulls: false,

  // enableQueryBatching: On the client side, use something like apollo-link-batch-http to make use of this
  enableQueryBatching: true,

  // ignoreIndexes=false: honour your DB indexes - only expose things that are fast
  ignoreIndexes: true,

  // dynamicJson: instead of inputting/outputting JSON as strings, input/output raw JSON objects
  dynamicJson: true,

  // ignoreRBAC=false: honour the permissions in your DB - don't expose what you don't GRANT
  ignoreRBAC: false,

  legacyRelations: "omit",
  graphiql: !isProd,
  enhanceGraphiql: !isProd,
  disableDefaultMutations: false,

  // Automatically update GraphQL schema when database changes
  watchPg: !isProd,

  // Keep data/schema.graphql up to date
  sortExport: true,
  exportGqlSchemaPath: !isProd ? `${__dirname}/../../../../data/schema.graphql` : undefined,

  disableQueryLog: isProd,

  // On production we still want to start even if the database isn't available.
  // On development, we want to deal nicely with issues in the database.
  // For these reasons, we're going to keep retryOnInitFail enabled for both environments.
  retryOnInitFail: true,

  // showErrorStack: !isProd ? "json" : false,
  // Allow EXPLAIN in development (you can replace this with a callback function if you want more control)
  allowExplain: !isProd,

  graphileBuildOptions: {
    // Restrict filtering to specific operators
    connectionFilterAllowedOperators: ["equalTo"],
    // Disable filtering with logical operators
    connectionFilterLogicalOperators: false,
    // Enable filtering on related fields
    connectionFilterRelations: true,
  },

  /*
   * Postgres transaction settings for each GraphQL query/mutation to
   * indicate to Postgres who is attempting to access the resources. These
   * will be referenced by RLS policies/triggers/etc.
   *
   * Settings set here will be set using the equivalent of `SET LOCAL`, so
   * certain things are not allowed. You can override Postgres settings such
   * as 'role' and 'search_path' here; but for settings indicating the
   * current user, session id, or other privileges to be used by RLS policies
   * the setting names must contain at least one and at most two period
   * symbols (`.`), and the first segment must not clash with any Postgres or
   * extension settings. We find `jwt.claims.*` to be a safe namespace,
   * whether or not you're using JWTs.
   */
  async pgSettings(
    req: Request & {
      auth?: User;
    },
  ) {
    const settings: any = {};

    req.log.info("pgSettings");
    if (req.auth) {
      req.log.info(req.auth);
      settings["pf_user.sub"] = req.auth.sub ?? "";
      settings["pf_user.scope"] = req.auth.scope ?? "";
      settings["pf_user.iat"] = req.auth.iat ?? 0;
      settings["pf_user.exp"] = req.auth.exp ?? 0;
      settings["search_path"] = "pf_public,public,pf_private";
    }

    const isAdminUser = adminPermissions.every(
      (permission) => req.auth && req.auth.permissions && req.auth.permissions.includes(permission),
    );
    const isFullUser = fullUserPermissions.every(
      (permission) => req.auth && req.auth.permissions && req.auth.permissions.includes(permission),
    );
    const isPartnerUser = partnerPermissions.find(
      (permission) => req.auth && req.auth.permissions && req.auth.permissions.includes(permission),
    );
    const isPublicApiUser = publicApiUserPermissions.every(
      (permission) => req.auth && req.auth.permissions && req.auth.permissions.includes(permission),
    );

    // Set those header for authenticated users to prevent caching secure content
    if (isAdminUser || isPartnerUser || isFullUser) {
      req.res?.set("Cache-Control", "no-cache");
      req.res?.set("Pragma", "no-cache");
    }
    // Enforce HTTPS policy
    req.res?.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    settings["role"] = isAdminUser
      ? DB_ADMIN_ROLE
      : isFullUser
      ? DB_AUTHENTICATED_ROLE
      : isPartnerUser
      ? DB_PARTNER_ROLE
      : isPublicApiUser
      ? DB_VISITOR_ROLE
      : DB_VISITOR_ROLE;
    return settings;
  },

  async additionalGraphQLContextFromRequest(
    req: Request & {
      rateLimit?: { limit: number; current: number; remaining: number; resetTime: Date };
      auth?: User;
    },
  ) {
    let rateLimitThreshold = null;
    if (req.rateLimit && req.rateLimit.limit) {
      rateLimitThreshold = Math.ceil((req.rateLimit.current / req.rateLimit.limit) * 100);
    }
    return {
      userIp: req.headers["x-forwarded-for"] || req.ip,
      userSub: req.auth?.sub || "",
      rateLimitThreshold,
    };
  },
};

export default (app: Express) => {
  debug("Init");

  // Something caused postgraphile to throw type errors here
  // error TS2345: Argument of type 'Pool' is not assignable to parameter of type 'string | Pool | PoolConfig | undefined'.
  const middleware = postgraphile<Request, Response>(authPgPool as any, schemas, options);

  app.set("postgraphileMiddleware", middleware);

  app.use(middleware);

  debug("Init Finished");
};
