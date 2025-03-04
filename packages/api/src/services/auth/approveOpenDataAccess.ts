import { verify } from "../../services/auth/token";
import createClient, { AuthClient } from "../../services/auth/client";
import sendAccessEmail, { composeEmail } from "./sendAccessEmail";
import { env } from "../../utils";
import { formFieldsNameIdMap } from "../../utils/form";
import grantPfProAccess from "./grantPfProAccess";
import { defaultClosingValue, defaultNoteValue } from "../../utils/emailConsts";

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

const getFormFieldValueById = (id: string, formFields: Record<string, RequestField>) =>
  formFields[id].value;

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
  try {
    createUserAccessRequestResponse = await context.pgClient.query(
      "select * from pf_public.create_user_access_request ($1, $2, $3)",
      [formName, email, formFields],
    );
  } catch (error) {
    console.error(error);
    throw error;
  }

  const requestId = createUserAccessRequestResponse.rows[0]?.create_user_access_request;

  const whatWouldYouLikeToUse: { id: string; name: string }[] = getFormFieldValueById(
    formFieldsNameIdMap["whatWouldYouLikeToUse"],
    formFields,
  );

  const firstName = getFormFieldValueById(formFieldsNameIdMap["firstName"], formFields);
  const lastName = getFormFieldValueById(formFieldsNameIdMap["lastName"], formFields);
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
          response.error = clientResponse.client.message;
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
          response.error = pfProAccessResponse.user.message;
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

    await sendAccessEmail(email, composedEmail);

    try {
      await context.pgClient.query(
        "select pf_public.pf_update_user_access_request ($1, $2, $3, $4, $5, $6, $7, $8)",
        [requestId, true, defaultNoteValue, defaultClosingValue, false, composedEmail, null, null],
      );
    } catch (error) {
      console.error(error);
    }

    return response;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export default approveOpenDataAccess;
