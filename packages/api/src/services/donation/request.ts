import fetch, { Response } from "node-fetch";
import * as env from "../../utils/env";
import { EveryOrgObject } from "../../routes/donate";
import { formFieldsDonation } from "../../routes/donate/fields";

interface AirtableData {
  records: {
    fields: Record<string, string>;
  }[];
}

export const submitToAirtable = async (data: EveryOrgObject): Promise<Response> => {
  const baseID = env.AIRTABLE_DONATION_BASE_ID;
  const tableID = env.AIRTABLE_DONATION_TABLE_ID;
  const airtableAccessToken = env.AIRTABLE_ACCESS_TOKEN;

  const airtableUrl = `https://api.airtable.com/v0/${baseID}/${tableID}`;

  const airtableData: AirtableData = {
    records: [
      {
        fields: {
          [formFieldsDonation["Full Name"]]: `${data.firstName ?? ""} ${
            data.lastName ?? ""
          }`.trim(),
          [formFieldsDonation["Email"]]: data.email || "",
          [formFieldsDonation["Total Donated"]]: String(data.amount || ""),
          [formFieldsDonation["Donation Date"]]: data.donationDate || "",
          [formFieldsDonation["Private Note"]]: data.privateNote || "",
        },
      },
    ],
  };

  return fetch(airtableUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${airtableAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(airtableData),
  });
};
