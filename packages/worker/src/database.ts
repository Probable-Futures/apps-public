import { readFileSync } from "fs";
import { Pool } from "pg";
import { RedisClientOptions, createClient } from "redis";
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
function swallowPoolError(e: any) {
  logger.error("swallowing PgPool error: %o", e);
}

const debugPoolEvent = (eventName: string) => debug(`Pool: ${eventName}`);

const ssl = env.isLocal
  ? false
  : {
      ca: readFileSync(constants.rdsRootCA).toString(),
    };

export const pgPool = new Pool({
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  host: env.DATABASE_HOST,
  database: env.DATABASE_NAME,
  port: env.DATABASE_PORT,
  application_name: "worker",
  ssl,
});

pgPool.on("error", swallowPoolError);

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
