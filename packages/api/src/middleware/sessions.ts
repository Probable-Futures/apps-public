import { Express } from "express";
import ConnectPgSimple from "connect-pg-simple";
import ConnectRedis from "connect-redis";
import * as redis from "redis";
import session from "express-session";

import { rootPgPool } from "../database";
import { SESSION_SECRET, MAX_SESSION_DURATION_IN_MILLISECONDS } from "../utils/env";
import { logger } from "../utils/logger";

const PgStore = ConnectPgSimple(session);
const RedisStore = ConnectRedis(session);

export default (app: Express) => {
  logger.info("setup sessions");
  // We don't have redis deployed yet, but we'll probably want to in the near future
  const store = process.env.REDIS_URL
    ? /*
       * Using redis for session storage means the session can be shared across
       * multiple Node.js instances (and survives a server restart), see:
       *
       * https://medium.com/mtholla/managing-node-js-express-sessions-with-redis-94cd099d6f2f
       */
      new RedisStore({
        client: redis.createClient({
          url: process.env.REDIS_URL,
        }),
      })
    : /*
       * Using PostgreSQL for session storage is easy to set up, but increases
       * the load on your database. We recommend that you graduate to using
       * redis for session storage when you're ready.
       */
      new PgStore({
        pool: rootPgPool,
        schemaName: "pf_private",
        pruneSessionInterval: false,
        tableName: "connect_pg_simple_sessions",
        errorLog: logger.error.bind(logger),
      });

  const sessionMiddleware = session({
    rolling: true,
    saveUninitialized: false,
    resave: false,
    cookie: {
      maxAge: MAX_SESSION_DURATION_IN_MILLISECONDS,
    },
    store,
    secret: SESSION_SECRET,
  });

  app.use(sessionMiddleware);
};
