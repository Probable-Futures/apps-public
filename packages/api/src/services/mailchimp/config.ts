import { env } from "../../utils";

export const config = {
  apiKey: env.MAILCHIMP_API_KEY,
  apiEndpoint: env.MAILCHIMP_API_ENDPOINT,
  contactListId: env.MAILCHIMP_CONTACT_LIST_ID,
};
