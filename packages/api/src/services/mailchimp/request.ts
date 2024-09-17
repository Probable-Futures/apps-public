import fetch, { Headers, RequestInit, Response } from "node-fetch";

import { error } from "../../utils";
import { config } from "./config";

export async function sendRequest(pathname: string, options: RequestInit = {}): Promise<Response> {
  const credentials = Buffer.from(`functions:${config.apiKey}`, "utf8").toString("base64");
  const response = await fetch(`${config.apiEndpoint}/${pathname}`, {
    ...options,
    headers: new Headers([
      ["Authorization", `Basic ${credentials}`],
      ["Content-Type", "application/json"],
    ]),
  });
  if (!response.ok) {
    const body = (await response.json()) as { detail: any; errors: any; title: string };
    const err = error.collect(500, body.detail, body.errors, body.title);
    throw err;
  }

  return response;
}
