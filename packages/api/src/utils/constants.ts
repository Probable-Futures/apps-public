import path from "path";

export const apiRoutes = {
  healthCheck: "/healthz",
  graphql: "/graphql",
  graphiql: "/graphiql",
  contact: "/contact",
  upload: "/upload",
  auth: "/auth",
  donate: "/donate",
  tracking: "/tracking",
  data: "/data",
};

export const GENERIC_ERROR_MESSAGE = "An error occurred while processing your request.";

export const rdsRootCA = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "/data/amazon-rds-ca-bundle.pem",
);
