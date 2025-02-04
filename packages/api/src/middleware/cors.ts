import { constants } from "../utils";
import { Express, Request } from "express";
import cors from "cors";

const { apiRoutes } = constants;

export default (app: Express) => {
  const corsOptions = (
    req: Request,
    callback: (err: Error | null, options?: cors.CorsOptions) => void,
  ) => {
    let allowedOrigins = [
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
      "https://docs.probablefutures.org",
    ];

    let origin: string | string[] = allowedOrigins;

    if (req.path === "/token" || req.method === "OPTIONS") {
      origin = "*";
    } else if (req.path === apiRoutes.graphql || req.path === "/") {
      let requestBody: any = req.body;

      if (
        typeof requestBody?.query === "string" &&
        requestBody.query.includes("getDatasetStatistics")
      ) {
        origin = "*";
      }
    }

    callback(null, {
      origin,
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
  };

  const middleware = cors(corsOptions);

  app.use(apiRoutes.graphql, middleware);
  app.use(apiRoutes.contact, middleware);
  app.use(apiRoutes.donate, middleware);
  app.use(apiRoutes.auth, middleware);
  app.use(apiRoutes.upload, middleware);
};
