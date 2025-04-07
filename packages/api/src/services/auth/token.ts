import * as types from "./types";
import { redisClient } from "../../database";
import { request } from "./request";

const debug = require("debug")("api-users");

const KEY = "api-users";
const CACHE_VERSION = "1";

type Auth0TokenResponse = {
  access_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
};

async function getToken(
  clientId: string,
  clientSecret: string,
  audience: string,
): Promise<types.ApiUser> {
  const postData = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    audience: audience,
    grant_type: "client_credentials",
  });

  const result = await request<Auth0TokenResponse>("/oauth/token", "POST", postData);
  return {
    access_token: result.access_token,
    scope: result.scope,
    token_type: result.token_type,
    expires_at: new Date(new Date().getTime() + result.expires_in * 1000),
  };
}

export async function verify(
  clientId: string,
  clientSecret: string,
  audience: string,
): Promise<types.ApiUser> {
  debug("Input: %o", clientId);

  let results: types.ApiUser;
  const cache = await redisClient.HGETALL(KEY);
  const redisKey = `${clientId}-v${CACHE_VERSION}`;

  if (!cache[redisKey]) {
    results = await getToken(clientId, clientSecret, audience);
    redisClient.HSET(KEY, redisKey, JSON.stringify(results));
  } else {
    results = JSON.parse(cache[redisKey]) as types.ApiUser;
    if (
      !results.access_token ||
      results.expires_at === null ||
      new Date(results.expires_at) < new Date()
    ) {
      results = await getToken(clientId, clientSecret, audience);
      redisClient.HSET(KEY, redisKey, JSON.stringify(results));
    }
  }

  debug("Output: %o", { ...results });
  return { ...results };
}
