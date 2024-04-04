import { readFileSync } from "fs";
import { Pool, PoolConfig, PoolClient } from "pg";
import { createClient, RedisClientOptions } from "redis";

import { env, logger, extendDebugger, constants } from "./utils";

const debug = extendDebugger("database");
/**
 * When a PoolClient omits an 'error' event that cannot be caught by a promise
 * chain (e.g. when the PostgreSQL server terminates the link but the client
 * isn't actively being used) the error is raised via the Pool. In Node.js if
 * an 'error' event is raised and it isn't handled, the entire process exits.
 * This NOOP handler avoids this occurring on our pools.
 *
 * TODO: log this to an error reporting service.
 */
function swallowPoolError(e: Error) {
  logger.error("swallowing PgPool error: %o", e);
}

const logPoolEvent = (eventName: string, poolName: string) =>
  logger.debug(`${eventName} on ${poolName}Pool`);

const ssl = env.isLocal
  ? false
  : {
      ca: readFileSync(constants.rdsRootCA).toString(),
    };

const basePoolConfig: PoolConfig = {
  host: env.DATABASE_HOST,
  database: env.DATABASE_NAME,
  port: env.DATABASE_PORT,
  application_name: "graphql_api",
  ssl,
};

function buildConnectionString({ user, pw, host, port, db }: any): string {
  const appName = `application_name=${basePoolConfig.application_name}`;
  const sslMode = `sslmode=${env.isDev ? "disable" : "require"}`;

  return `postgres://${user}:${pw}@${host}:${port}/${db}?${sslMode}&${appName}`;
}

export const ownerConnectionString = buildConnectionString({
  user: env.DB_OWNER_ROLE,
  pw: env.DB_OWNER_ROLE_PASSWORD,
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  db: env.DATABASE_NAME,
});

// This pool runs as the database owner, so it can do anything.
export const rootPgPool = new Pool({
  user: env.DB_OWNER_ROLE,
  password: env.DB_OWNER_ROLE_PASSWORD,
  ...basePoolConfig,
});

rootPgPool.on("error", swallowPoolError);
rootPgPool.on("connect", () => logPoolEvent("connect", "root"));
rootPgPool.on("acquire", () => logPoolEvent("acquire", "root"));
rootPgPool.on("remove", () => logPoolEvent("remove", "root"));

// This pool runs as the unprivileged user, it's what PostGraphile uses.
export const authPgPool = new Pool({
  user: env.DB_GRAPHILE_ROLE,
  password: env.DB_GRAPHILE_ROLE_PASSWORD,
  ...basePoolConfig,
});

authPgPool.on("error", swallowPoolError);
authPgPool.on("connect", () => logPoolEvent("connect", "auth"));
authPgPool.on("acquire", (c: PoolClient) => {
  logPoolEvent("acquire", "auth");
  return c.on("notice", () => logPoolEvent("acquire-notice", "auth"));
});
authPgPool.on("remove", () => logPoolEvent("remove", "auth"));

const getPoolProperties = ({ idleCount, totalCount, waitingCount }: Pool) => ({
  idleCount,
  totalCount,
  waitingCount,
});

export const healthCheck = async () => {
  debug("checking pg connections");

  const rootClient = await rootPgPool.connect();
  const authClient = await authPgPool.connect();
  await rootClient.query("SELECT NOW()");
  await authClient.query("SELECT NOW()");
  rootClient.release();
  authClient.release();

  return {
    rootPool: getPoolProperties(rootPgPool),
    authPool: getPoolProperties(authPgPool),
  };
};

// Redis Connection
const redisOptions: RedisClientOptions = {
  url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`,
};

export const redisClient = createClient(redisOptions);

(async () => {
  await redisClient.connect();
})();

redisClient.on("connect", function () {
  console.log("redis connected!");
});

redisClient.on("error", function (e) {
  logger.error("redis connection error: %o", e);
  console.log(e);
});
