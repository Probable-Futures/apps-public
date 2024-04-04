import { mapKeys, snakeCase } from "lodash";
import fetch, { Headers, RequestInit, Response } from "node-fetch";
import md5 from "md5";

import { error, env } from "../../utils";

const config = {
  apiKey: env.MAILCHIMP_API_KEY,
  apiEndpoint: env.MAILCHIMP_API_ENDPOINT,
  contactListId: env.MAILCHIMP_CONTACT_LIST_ID,
};

export interface NewContact {
  emailAddress: string;
  mergeFields: { [name: string]: unknown };
  status: "subscribed" | "unsubscribed";
}

export async function createContact(newContact: NewContact): Promise<string> {
  const response = await sendRequest(
    `/lists/${config.contactListId}/members/${md5(newContact.emailAddress)}`,
    {
      method: "PUT",
      body: JSON.stringify(mapKeys(newContact, (_, key) => snakeCase(key))),
    },
  );
  const { id } = (await response.json()) as { id: string; status: string };

  return id;
}

async function sendRequest(pathname: string, options: RequestInit = {}): Promise<Response> {
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
    const err = error.collect(500, body.detail, body.errors);

    throw err;
  }

  return response;
}
