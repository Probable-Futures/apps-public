import rateLimit from "express-rate-limit";
import { Express } from "express";

import { constants } from "../utils";

const { apiRoutes } = constants;

export default (app: Express) => {
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1min
    max: 100, // Limit each IP to 100 requests per `window` (here 100 requests per 1 min)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  app.use(apiRoutes.graphql, apiLimiter);
};
