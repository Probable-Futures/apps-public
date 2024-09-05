import path from "path";

export const apiRoutes = {
  healthCheck: "/healthz",
  graphql: "/graphql",
  graphiql: "/graphiql",
  contact: "/contact",
  upload: "/upload",
  auth: "/auth",
  donate: "/donate",
};

export const rdsRootCA = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "/data/amazon-rds-ca-bundle.pem",
);
