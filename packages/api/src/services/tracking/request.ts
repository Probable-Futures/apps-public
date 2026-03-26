import fetch, { Response } from "node-fetch";
import * as env from "../../utils/env";
import { ImpactTrackingFormData } from "../../routes/tracking/parameters";
import { formFieldsImpactTracking } from "../../routes/tracking/fields";
import { logger } from "../../utils";

interface AirtableData {
  records: {
    fields: Record<string, string | number | boolean>;
  }[];
}

export const submitToAirtable = async (data: ImpactTrackingFormData): Promise<Response> => {
  const baseID = env.AIRTABLE_IMPACT_TRACKING_BASE_ID;
  const tableID = env.AIRTABLE_IMPACT_TRACKING_TABLE_ID;
  const airtableAccessToken = env.AIRTABLE_ACCESS_TOKEN_FOR_IMPACT_TRACKING;

  const airtableUrl = `https://api.airtable.com/v0/${baseID}/${tableID}`;

  const fields: Record<string, string | number | boolean> = {
    [formFieldsImpactTracking["Helpful"]]: data.helpful ? "Helpful" : "Not Helpful",
    [formFieldsImpactTracking["Article Name"]]: data.articleName,
    [formFieldsImpactTracking["Article Link"]]: data.articleLink,
    [formFieldsImpactTracking["Submission Date"]]: new Date().toISOString().split("T")[0],
  };

  if (data.email) {
    fields[formFieldsImpactTracking["Email"]] = data.email;
  }

  if (data.whatWasHelpful) {
    fields[formFieldsImpactTracking["What Was Helpful"]] = data.whatWasHelpful;
  }

  if (data.howToImprove) {
    fields[formFieldsImpactTracking["How To Improve"]] = data.howToImprove;
  }

  if (data.perspectiveCategory) {
    fields[formFieldsImpactTracking["Perspective Category"]] = data.perspectiveCategory;
  }

  return postToAirtable(airtableUrl, airtableAccessToken, fields);
};

async function postToAirtable(
  url: string,
  token: string,
  fields: Record<string, string | number | boolean>,
): Promise<Response> {
  const airtableData: AirtableData = {
    records: [{ fields }],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(airtableData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const errorMessage = (errorData as { error?: { message?: string } })?.error?.message ?? "";
    const unknownFieldMatch = errorMessage.match(/Unknown field name: "([^"]+)"/);

    if (unknownFieldMatch) {
      const unknownField = unknownFieldMatch[1];
      logger.warn(`Airtable unknown field "${unknownField}", retrying without it.`);
      const { [unknownField]: _, ...remainingFields } = fields;

      if (Object.keys(remainingFields).length === 0) {
        return response;
      }

      return postToAirtable(url, token, remainingFields);
    }

    return response;
  }

  return response;
}
