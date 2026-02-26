import { verify } from "../../services/auth/token";
import createClient, { AuthClient } from "../../services/auth/client";
import sendAccessEmail, { composeEmail } from "./sendAccessEmail";
import { env, logger, slackUtils } from "../../utils";
import { formFieldsNameIdMap } from "../../utils/form";
import grantPfProAccess from "./grantPfProAccess";
import { defaultClosingValue, defaultNoteValue } from "../../utils/emailConsts";
import { getSubscriber } from "../../services/mailchimp/member";
import { NewContact } from "../../services/mailchimp/mailchimp.types";
import { MergeField } from "../../routes/contact";
import { createContact } from "../../services/mailchimp/mailchimp";

type AnyArg = { [arg: string]: any };

type RequestField = {
  name: string;
  value: any;
};

type Response = {
  userId?: string;
  clientId?: string;
  error?: string;
  userAlreadyExists?: boolean;
};

const errorPrefix = "Approve Open Data Request Error";

const getFormFieldValueById = (id: string, formFields: Record<string, RequestField>) =>
  formFields[id]?.value;

const approveOpenDataAccess = async (
  _query: AnyArg,
  args: AnyArg,
  context: AnyArg,
): Promise<Response> => {
  const { formName, email, formFields } = args.input;

  if (!formName) {
    throw Error("formName is missing.");
  }
  if (!email) {
    throw Error("email is missing.");
  }
  if (!formFields) {
    throw Error("formFields is missing.");
  }

  let createUserAccessRequestResponse,
    response: Response = {};
  const errorRelevantData = `Email: ${email}, Form: ${formName}`;
  try {
    createUserAccessRequestResponse = await context.pgClient.query(
      "select * from pf_public.create_user_access_request ($1, $2, $3)",
      [formName, email, formFields],
    );
  } catch (error) {
    logger.error({ err: error }, "Failed to create user access request");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create user access request in DB";
    await slackUtils.sendErrorToSlack(errorMessage, errorPrefix, errorRelevantData);
    throw error;
  }

  const requestId = createUserAccessRequestResponse.rows[0]?.create_user_access_request;

  if (!requestId) {
    const errorMessage = "create_user_access_request returned no request ID";
    logger.error(errorMessage);
    await slackUtils.sendErrorToSlack(errorMessage, errorPrefix, errorRelevantData);
    throw new Error(errorMessage);
  }

  const whatWouldYouLikeToUse: { id: string; name: string }[] =
    getFormFieldValueById(formFieldsNameIdMap["whatWouldYouLikeToUse"], formFields) || [];

  const firstName = getFormFieldValueById(formFieldsNameIdMap["firstName"], formFields);
  const lastName = getFormFieldValueById(formFieldsNameIdMap["lastName"], formFields);
  const emailList = getFormFieldValueById(formFieldsNameIdMap["emailList"], formFields);
  const fullName = `${firstName} ${lastName}`;

  try {
    const auth0ManagementToken = await verify(
      env.AUTH_MANAGEMENT_CLIENT_ID,
      env.AUTH_MANAGEMENT_CLIENT_SECRET,
      "https://" + env.AUTH0_DOMAIN + "/api/v2/",
    );

    let auth0Client: AuthClient | undefined = undefined;

    let grantedAccessToPro = false;
    let includeCustomizableMaps = false;
    for (const item of whatWouldYouLikeToUse) {
      // if a user wants access to the Probable Futures API
      if (item.id === formFieldsNameIdMap["pfApi"]) {
        const clientResponse = await createClient(
          fullName.trim(),
          auth0ManagementToken.access_token,
        );
        if (
          clientResponse.client.statusCode !== 200 &&
          clientResponse.client.statusCode !== 201 &&
          clientResponse.client.error
        ) {
          response.error = [response.error, clientResponse.client.message]
            .filter(Boolean)
            .join("\n");
        } else {
          auth0Client = clientResponse.client;
          response.clientId = clientResponse.client.client_id;
        }
      }
      // access to Probable Futures Pro
      else if (
        !grantedAccessToPro &&
        (item.id === formFieldsNameIdMap["pfRawData"] || item.id === formFieldsNameIdMap["pfPro"])
      ) {
        const pfProAccessResponse = await grantPfProAccess(
          email,
          fullName.trim(),
          auth0ManagementToken.access_token,
        );
        if (
          pfProAccessResponse.user.statusCode !== 200 &&
          pfProAccessResponse.user.statusCode !== 201 &&
          pfProAccessResponse.user.error
        ) {
          response.error = [response.error, pfProAccessResponse.user.message]
            .filter(Boolean)
            .join("\n");
        } else {
          response.userId = pfProAccessResponse.user.user_id;
          response.userAlreadyExists = pfProAccessResponse.alreadyExists;
        }
        grantedAccessToPro = true;
      } else if (item.id === formFieldsNameIdMap["customizableMaps"]) {
        includeCustomizableMaps = true;
      }
    }

    const composedEmail = composeEmail({
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(),
      authClient: auth0Client,
      authUser: response.userId
        ? {
            userId: response.userId,
            email,
          }
        : undefined,
      includeCustomizableMaps,
    });

    try {
      await sendAccessEmail(email, composedEmail);
    } catch (error) {
      logger.error({ err: error }, "Failed to send access email");
      const errorMessage = error instanceof Error ? error.message : "Failed to send access email";
      await slackUtils.sendErrorToSlack(errorMessage, errorPrefix, errorRelevantData);
      // Don't throw — continue to update the request and subscribe to Mailchimp
      response.error = [response.error, errorMessage].filter(Boolean).join("\n");
    }

    try {
      await context.pgClient.query(
        "select pf_public.pf_update_user_access_request ($1, $2, $3, $4, $5, $6, $7, $8)",
        [requestId, true, defaultNoteValue, defaultClosingValue, false, composedEmail, null, null],
      );
    } catch (error) {
      logger.error({ err: error }, "Failed to update user access request");
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user access request in DB";
      await slackUtils.sendErrorToSlack(errorMessage, errorPrefix, errorRelevantData);
    }

    try {
      if (
        emailList === "Yes, please sign me up." ||
        emailList?.name === "Yes, please sign me up."
      ) {
        const user = await getSubscriber(email);
        const statusToSend = user?.status === "subscribed" ? "subscribed" : "pending";

        const newContact: NewContact = {
          emailAddress: email,
          mergeFields: {
            [MergeField.FName]: firstName,
            [MergeField.LName]: lastName,
          },
          status: statusToSend,
        };

        const { contactId, status, emailAddress } = await createContact(newContact);
        logger.info(
          `Contact created in Mailchimp: ${contactId}, status: ${status}, email: ${emailAddress}`,
        );
      }
    } catch (e) {
      logger.error({ err: e }, "Failed to create Mailchimp contact");
      const errorMessage = e instanceof Error ? e.message : "Failed to create Mailchimp contact";
      await slackUtils.sendErrorToSlack(errorMessage, errorPrefix, errorRelevantData);
    }

    if (response.error) {
      await slackUtils.sendErrorToSlack(response.error, errorPrefix, errorRelevantData);
    }
    return response;
  } catch (e) {
    logger.error({ err: e }, "Unexpected error in approveOpenDataAccess");
    if (e instanceof Error) {
      await slackUtils.sendErrorToSlack(e.message, errorPrefix, errorRelevantData);
    } else {
      await slackUtils.sendErrorToSlack(
        "An unexpected error occurred.",
        errorPrefix,
        errorRelevantData,
      );
    }
    throw e;
  }
};

export default approveOpenDataAccess;
