import { Response } from "node-fetch";
import md5 from "md5";

import { Status, Subscriber } from "./mailchimp.types";
import { sendRequest } from "./request";
import { config } from "./config";

// Mailchimp keys list members by the MD5 hash of the lowercased email address.
export const subscriberHash = (emailAddress: string): string => md5(emailAddress.toLowerCase());

export async function getSubscriber(emailAddress: string): Promise<Subscriber> {
  let response: Response | undefined;
  let user: Subscriber = {
    userId: "",
    status: "pending",
  };
  try {
    response = await sendRequest(
      `lists/${config.contactListId}/members/${subscriberHash(emailAddress)}`,
      {
        method: "GET",
      },
    );
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
