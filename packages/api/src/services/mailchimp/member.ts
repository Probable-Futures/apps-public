import { Response } from "node-fetch";
import md5 from "md5";

import { Status, Subscriber } from "./mailchimp.types";
import { sendRequest } from "./request";
import { config } from "./config";

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
