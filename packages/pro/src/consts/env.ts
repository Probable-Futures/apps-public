import env from "env-var";

export const NODE_ENV = env.get("NODE_ENV").asString();
export const isProd = NODE_ENV === "production";

export const DEPLOY_ENV = env.get("REACT_APP_DEPLOY_ENV").default("local").asString();
export const isLocal = DEPLOY_ENV === "local";

export const AUTH0_DOMAIN = env.get("REACT_APP_AUTH0_DOMAIN").required(!isLocal).asString();
export const AUTH0_CLIENT_ID = env.get("REACT_APP_AUTH0_CLIENT_ID").required(!isLocal).asString();
export const AUTH0_AUDIENCE = env
  .get("REACT_APP_AUTH0_API_IDENTIFIER")
  .required(!isLocal)
  .asString();

export const GRAPHQL_API_KEY = env.get("REACT_APP_GRAPHQL_API_KEY").required().asString();
export const GRAPHQL = env.get("REACT_APP_GRAPHQL").required().asString();

export const MAPBOX_ACCESS_TOKEN = env.get("REACT_APP_MAPBOX_ACCESS_TOKEN").required().asString();

export const EMBEDDABLE_MAPS_MAPBOX_ACCESS_TOKEN = env
  .get("REACT_APP_EMBEDDABLE_MAPS_MAPBOX_ACCESS_TOKEN")
  .required()
  .asString();

export const PF_API = env.get("REACT_APP_PF_API").required().asString();
