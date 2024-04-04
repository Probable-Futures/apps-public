import https from "https";

import * as types from "./types";
import { redisClient } from "../../database";
import { env } from "../../utils";

const debug = require("debug")("api-users");

const KEY = "api-users";
const CACHE_VERSION = "1";

type Auth0TokenResponse = {
  access_token: string;
  scope: string;
  expires_in: number;
  token_type: string;
};

const request = async (data: string): Promise<Auth0TokenResponse> => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: env.AUTH0_DOMAIN,
      path: "/oauth/token",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        resolve(JSON.parse(responseData));
      });
    });

    req.on("error", (error) => {
      reject(new Error("Error getting token"));
    });

    req.write(data);
    req.end();
  });
};

async function getToken(clientId: string, clientSecret: string): Promise<types.ApiUser> {
  const postData = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    audience: env.AUTH0_AUDIENCE.replace(/\/$/, ""),
    grant_type: "client_credentials",
  });

  const result = await request(postData);
  return {
    access_token: result.access_token,
    scope: result.scope,
    token_type: result.token_type,
    expires_at: new Date(new Date().getTime() + result.expires_in * 1000),
  };
}

export async function verify(clientId: string, clientSecret: string): Promise<types.ApiUser> {
  debug("Input: %o", clientId);

  let results: types.ApiUser;
  const cache = await redisClient.HGETALL(KEY);
  const redisKey = `${clientId}-v${CACHE_VERSION}`;

  if (!cache[redisKey]) {
    results = await getToken(clientId, clientSecret);
    redisClient.HSET(KEY, redisKey, JSON.stringify(results));
  } else {
    results = JSON.parse(cache[redisKey]) as types.ApiUser;

    if (new Date(results.expires_at) < new Date()) {
      results = await getToken(clientId, clientSecret);
      redisClient.HSET(KEY, redisKey, JSON.stringify(results));
    }
  }

  debug("Output: %o", { ...results });
  return { ...results };
}
