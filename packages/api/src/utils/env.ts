import "dotenv/config";
import * as env from "env-var";

export const DEPLOY_ENV = env.get("DEPLOY_ENV").default("local").asString();

export const isLocal = DEPLOY_ENV === "local";

export const NODE_ENV = env.get("NODE_ENV").default("development").asString();

export const isDev = NODE_ENV === "development";
export const isProd = NODE_ENV === "production";

export const LOG_LEVEL = env.get("LOG_LEVEL").default("info").asString();

export const SHUTDOWN_TIMEOUT = env.get("SHUTDOWN_TIMEOUT").default(1000).asIntPositive();

export const PORT = env.get("PORT").default(5433).asPortNumber();

export const API_KEY = env.get("API_KEY").required().asString();

export const MAILCHIMP_API_KEY = env.get("MAILCHIMP_API_KEY").required().asString();

export const MAILCHIMP_API_ENDPOINT = env.get("MAILCHIMP_API_ENDPOINT").required().asString();

export const MAILCHIMP_CONTACT_LIST_ID = env.get("MAILCHIMP_CONTACT_LIST_ID").required().asString();

export const DATABASE_HOST = env.get("DATABASE_HOST").required().asString();

export const DATABASE_PORT = env.get("DATABASE_PORT").default(5432).asPortNumber();

export const DATABASE_NAME = env.get("DATABASE_NAME").required().asString();

export const DB_OWNER_ROLE = env.get("DB_OWNER_ROLE").required().asString();

export const DB_OWNER_ROLE_PASSWORD = env.get("DB_OWNER_ROLE_PASSWORD").required().asString();

export const DB_GRAPHILE_ROLE = env.get("DB_GRAPHILE_ROLE").required().asString();

export const DB_GRAPHILE_ROLE_PASSWORD = env.get("DB_GRAPHILE_ROLE_PASSWORD").required().asString();

export const DB_VISITOR_ROLE = env.get("DB_VISITOR_ROLE").required().asString();

export const DB_AUTHENTICATED_ROLE = env.get("DB_AUTHENTICATED_ROLE").required().asString();

export const DB_PARTNER_ROLE = env.get("DB_PARTNER_ROLE").required().asString();

export const DB_ADMIN_ROLE = env.get("DB_ADMIN_ROLE").required().asString();

export const AWS_KEY = env.get("UPPY_COMPANION_AWS_KEY").required().asString();

export const AWS_SECRET = env.get("UPPY_COMPANION_AWS_SECRET").required().asString();

export const AWS_S3_UPLOADS_BUCKET = env.get("PRO_AWS_S3_BUCKET").required().asString();

export const AWS_S3_REGION = env.get("UPPY_COMPANION_AWS_S3_REGION").required().asString();

export const UPPY_COMPANION_SECRET_KEY = env.get("UPPY_COMPANION_SECRET_KEY").required().asString();

export const AUTH0_DOMAIN = env.get("AUTH0_DOMAIN").required().asString();
export const AUTH0_AUDIENCE = env.get("AUTH0_API_IDENTIFIER").required().asUrlString();

export const ROOT_URL = env.get("ROOT_URL").required().asString();

export const SESSION_SECRET = env.get("SESSION_SECRET").required().asString();

// Default to 1 day
export const MAX_SESSION_DURATION_IN_MILLISECONDS = env
  .get("MAX_SESSION_DURATION_IN_MILLISECONDS")
  .default(86400000)
  .asInt();

export const UPPY_COMPANION_GOOGLE_DRIVE_KEY = env
  .get("UPPY_COMPANION_GOOGLE_DRIVE_KEY")
  .required()
  .asString();

export const UPPY_COMPANION_GOOGLE_DRIVE_SECRET = env
  .get("UPPY_COMPANION_GOOGLE_DRIVE_SECRET")
  .required()
  .asString();

export const REDIS_PASSWORD = env.get("REDIS_PASSWORD").required().asString();

export const REDIS_PORT = env.get("REDIS_PORT").default(6379).asPortNumber();

export const REDIS_HOST = env.get("REDIS_HOST").required().asString();

export const MAPBOX_ACCESS_TOKEN = env.get("MAPBOX_ACCESS_TOKEN").required().asString();

export const AUTH_MANAGEMENT_CLIENT_ID = env.get("AUTH_MANAGEMENT_CLIENT_ID").required().asString();
export const AUTH_MANAGEMENT_CLIENT_SECRET = env
  .get("AUTH_MANAGEMENT_CLIENT_SECRET")
  .required()
  .asString();

export const AUTH_PRO_CLIENT_USER_DB_CONNECTION_NAME = env
  .get("AUTH_PRO_CLIENT_USER_DB_CONNECTION_NAME")
  .required()
  .asString();
export const AUTH_FULL_USER_ROLE_ID = env.get("AUTH_FULL_USER_ROLE_ID").required().asString();
