import { mapKeys, snakeCase } from "lodash";
import fetch, { Headers, RequestInit, Response } from "node-fetch";
import md5 from "md5";

import { error, env } from "../../utils";

const config = {
  apiKey: env.MAILCHIMP_API_KEY,
  apiEndpoint: env.MAILCHIMP_API_ENDPOINT,
  contactListId: env.MAILCHIMP_CONTACT_LIST_ID,
};

export type Status = "subscribed" | "unsubscribed" | "pending" | "archived";

export interface NewContact {
  emailAddress: string;
  mergeFields: { [name: string]: unknown };
  status: Status;
}

type Subscriber = {
  userId: string;
  status: Status;
};
export async function getSubscriber(emailAddress: string): Promise<Subscriber> {
  let response: Response | undefined;
  let user: Subscriber = {
    userId: "",
    status: "pending",
  };
  try {
    response = await sendRequest(`lists/${config.contactListId}/members/${md5(emailAddress)}`, {
      method: "GET",
    });
  } catch (e) {
    //@ts-ignore
    if (e.message === "The requested resource could not be found.") {
      user = {
        userId: "",
        status: "pending",
      };
    }
  }

  if (response instanceof Response) {
    const { id, status } = (await response.json()) as { id: string; status: Status };
    user = {
      userId: id,
      status,
    };
  }

  return user;
}

export async function createContact(
  newContact: NewContact,
): Promise<{ contactId: string; status: string; emailAddress: string }> {
  let response: Response | undefined;
  try {
    response = await sendRequest(
      `/lists/${config.contactListId}/members/${md5(newContact.emailAddress)}`,
      {
        method: "PUT",
        body: JSON.stringify(mapKeys(newContact, (_, key) => snakeCase(key))),
      },
    );
  } catch (e) {
    if ((e as error.ApplicationError).name === "Member In Compliance State") {
      response = await sendRequest(
        `/lists/${config.contactListId}/members/${md5(newContact.emailAddress)}`,
        {
          method: "PUT",
          body: JSON.stringify(
            mapKeys({ ...newContact, status: "pending" }, (_, key) => snakeCase(key)),
          ),
        },
      );
    } else {
      throw e;
    }
  }

  if (response instanceof Response) {
    const { id, status, email_address } = (await response.json()) as {
      id: string;
      status: Status;
      email_address: string;
    };
    return {
      contactId: id,
      status,
      emailAddress: email_address,
    };
  }

  return { contactId: "", status: "", emailAddress: "" };
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
    const err = error.collect(500, body.detail, body.errors, body.title);
    throw err;
  }

  return response;
}
