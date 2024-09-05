import { constants } from "../utils";
import { Express } from "express";
import cors from "cors";

const { apiRoutes } = constants;

export default (app: Express) => {
  const middleware = cors({
    // https://www.graphile.org/postgraphile/plugins/#origin-specific-cors
    origin: [
      "https://local.probablefutures.org",
      "https://dev-maps.probablefutures.org",
      "https://staging-maps.probablefutures.org",
      "https://maps.probablefutures.org",
      "https://dev-professional.probablefutures.org",
      "https://staging-professional.probablefutures.org",
      "https://professional.probablefutures.org",
      "https://dev-pro.probablefutures.org",
      "https://pro.probablefutures.org",
      "https://staging-probablefutures.kinsta.cloud",
      "https://probablefutures.kinsta.cloud",
      "https://editor.probablefutures.org",
      "https://probablefutures.org",
      "https://dev-maps-tour.probablefutures.org",
    ],
    methods: ["HEAD", "GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Accept",
      "Authorization",
      "X-Apollo-Tracing",
      "Content-Type",
      "Content-Length",
      "X-PostGraphile-Explain",
      "Api-Key",
      "Uppy-Versions",
      "uppy-auth-token",
    ],
    exposedHeaders: ["X-GraphQL-Event-Stream", "Access-Control-Allow-Headers"],
  });

  app.use(apiRoutes.graphql, middleware);
  app.use(apiRoutes.contact, middleware);
  app.use(apiRoutes.donate, middleware);
  app.use(apiRoutes.auth, middleware);
  app.use(apiRoutes.upload, middleware);
};
