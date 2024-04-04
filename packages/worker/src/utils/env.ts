import "dotenv/config";
import * as env from "env-var";

export const DEPLOY_ENV = env.get("DEPLOY_ENV").default("local").asString();

export const isLocal = DEPLOY_ENV === "local";

export const NODE_ENV = env.get("NODE_ENV").default("development").asString();

export const isDev = NODE_ENV === "development";
export const isProd = NODE_ENV === "production";

export const LOG_LEVEL = env.get("LOG_LEVEL").default("info").asString();

export const DATABASE_HOST = env.get("DATABASE_HOST").required().asString();

export const DATABASE_PORT = env.get("DATABASE_PORT").default(5432).asPortNumber();

export const DATABASE_USER = env.get("DATABASE_USER").required().asString();

export const DATABASE_PASSWORD = env.get("DATABASE_PASSWORD").required().asString();

export const DATABASE_NAME = env.get("DATABASE_NAME").required().asString();

export const AWS_SECRET = env.get("AWS_SECRET").required().asString();

export const AWS_KEY = env.get("AWS_KEY").required().asString();

export const AWS_S3_BUCKET = env.get("PRO_AWS_S3_BUCKET").required().asString();

export const AWS_S3_REGION = env.get("AWS_S3_REGION").required().asString();

export const REDIS_PASSWORD = env.get("REDIS_PASSWORD").required().asString();

export const REDIS_PORT = env.get("REDIS_PORT").default(6379).asPortNumber();

export const REDIS_HOST = env.get("REDIS_HOST").required().asString();

export const MAPBOX_ACCESS_TOKEN = env.get("MAPBOX_ACCESS_TOKEN").required().asString();
