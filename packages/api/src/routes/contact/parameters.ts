import Ajv from "ajv";
import addFormats from "ajv-formats";

import { collect } from "../../utils/error";
import * as contactRequestBodySchema from "./schema.json";

const ajv = new Ajv({
  allErrors: true,
  schemas: {
    body: contactRequestBodySchema,
  },
});

addFormats(ajv);

export interface FormData {
  emailAddress: string;
  firstName: string;
  lastName: string;
  includeAnswers: boolean;
  subscribeToEmails: boolean;
  tags?: string[];
  interests?: string[];
}

export async function validateFormData(body: { data: object }): Promise<FormData> {
  const isValid = await ajv.validate("body", body);

  if (!isValid) {
    throw collect(
      400,
      "invalid request body",
      ajv.errors?.map(({ instancePath, message }) => new Error(`body${instancePath} ${message}`)) ??
        [],
    );
  }

  return body.data as FormData;
}
