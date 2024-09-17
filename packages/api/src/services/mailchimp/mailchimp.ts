import { mapKeys, snakeCase, omit } from "lodash";
import { Response } from "node-fetch";
import md5 from "md5";

import { error } from "../../utils";
import { NewContact, Status } from "./mailchimp.types";
import { sendRequest } from "./request";
import { config } from "./config";
import { attachTagToMemeber } from "./tags";

export async function createContact(
  newContact: NewContact,
): Promise<{ contactId: string; status: string; emailAddress: string }> {
  let response: Response | undefined;
  try {
    response = await sendRequest(
      `/lists/${config.contactListId}/members/${md5(newContact.emailAddress)}`,
      {
        method: "PUT",
        body: JSON.stringify(mapKeys(omit(newContact, ["tags"]), (_, key) => snakeCase(key))),
      },
    );
    if (newContact.tags?.length) {
      await attachTagToMemeber(newContact.emailAddress, { tags: newContact.tags });
    }
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
      console.error(e);
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
