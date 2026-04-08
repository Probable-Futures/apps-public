export const isProd = import.meta.env.PROD;

export const DEPLOY_ENV = import.meta.env.VITE_DEPLOY_ENV || "local";
export const isLocal = DEPLOY_ENV === "local";

export const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN as string;
export const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID as string;
export const AUTH0_AUDIENCE = import.meta.env.VITE_AUTH0_API_IDENTIFIER as string;

export const GRAPHQL_API_KEY = import.meta.env.VITE_GRAPHQL_API_KEY as string;
export const GRAPHQL = import.meta.env.VITE_GRAPHQL as string;

export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string;

export const EMBEDDABLE_MAPS_MAPBOX_ACCESS_TOKEN = import.meta.env
  .VITE_EMBEDDABLE_MAPS_MAPBOX_ACCESS_TOKEN as string;

export const PF_API = import.meta.env.VITE_PF_API as string;
