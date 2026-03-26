import Ajv from "ajv";
import addFormats from "ajv-formats";

import { collect } from "../../utils/error";
import * as impactTrackingRequestBodySchema from "./schema.json";

const ajv = new Ajv({
  allErrors: true,
  schemas: {
    body: impactTrackingRequestBodySchema,
  },
});

addFormats(ajv);

export interface ImpactTrackingFormData {
  helpful: boolean;
  email?: string;
  whatWasHelpful?: string;
  howToImprove?: string;
  articleName: string;
  articleLink: string;
  perspectiveCategory?: string;
}

export async function validateFormData(body: { data: object }): Promise<ImpactTrackingFormData> {
  const isValid = await ajv.validate("body", body);

  if (!isValid) {
    throw collect(
      400,
      "invalid request body",
      ajv.errors?.map(({ instancePath, message }) => new Error(`body${instancePath} ${message}`)) ??
        [],
    );
  }

  return body.data as ImpactTrackingFormData;
}
