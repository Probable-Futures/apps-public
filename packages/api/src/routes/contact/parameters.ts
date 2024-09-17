import Ajv from "ajv";

import { collect } from "../../utils/error";
import * as contactRequestBodySchema from "./schema.json";

const ajv = new Ajv({
  allErrors: true,
  schemaId: "auto",
  schemas: {
    body: contactRequestBodySchema,
  },
});

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
      ajv.errors?.map(({ dataPath, message }) => new Error(`body${dataPath} ${message}`)) ?? [],
    );
  }

  return body.data as FormData;
}
