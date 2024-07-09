import { verify } from "../../services/auth/token";
import createClient, { AuthClient } from "../../services/auth/client";
import sendAccessEmail, { composeEmail } from "./sendAccessEmail";
import { env } from "../../utils";
import { formfieldsNameIdMap } from "../../utils/form";
import grantPfProAccess from "./grantPfProAccess";

type AnyArg = { [arg: string]: any };

type RequestField = {
  name: string;
  value: any;
};

type UserRequestResponse = {
  email: string;
  form_fields: Record<string, RequestField>;
  form_name: string;
  id: string;
  access_granted: boolean;
};

type Response = {
  userId?: string;
  clientId?: string;
  error?: string;
  userAlreadyExists?: boolean;
};

const getFormFieldValueById = (id: string, formFields: Record<string, RequestField>) =>
  formFields[id].value;

const acceptInvitation = async (
  _query: AnyArg,
  args: AnyArg,
  context: AnyArg,
): Promise<Response> => {
  const { requestId, note } = args.input;

  if (!requestId) {
    throw Error("RequestId is missing.");
  }

  let rawUserRequestResponse,
    response: Response = {};
  try {
    rawUserRequestResponse = await context.pgClient.query(
      "select * from pf_public.view_user_access_request where id = ($1)",
      [requestId],
    );
  } catch (error) {
    console.error(error);
  }

  const userRequestResponse = rawUserRequestResponse.rows[0] as UserRequestResponse;

  const whatWouldYouLikeToUse: { id: string; name: string }[] = getFormFieldValueById(
    formfieldsNameIdMap["whatWouldYouLikeToUse"],
    userRequestResponse.form_fields,
  );
  const firstName = getFormFieldValueById(
    formfieldsNameIdMap["firstName"],
    userRequestResponse.form_fields,
  );
  const lastName = getFormFieldValueById(
    formfieldsNameIdMap["lastName"],
    userRequestResponse.form_fields,
  );
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
      if (item.id === formfieldsNameIdMap["pfApi"]) {
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
        (item.id === formfieldsNameIdMap["pfRawData"] || item.id === formfieldsNameIdMap["pfPro"])
      ) {
        const pfProAccessResponse = await grantPfProAccess(
          userRequestResponse.email,
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
      } else if (item.id === formfieldsNameIdMap["customizableMaps"]) {
        includeCustomizableMaps = true;
      }
    }

    const composedEmail = composeEmail({
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(),
      authClient: auth0Client,
      authUser: response.userId
        ? {
            userId: response.userId,
            email: userRequestResponse.email,
          }
        : undefined,
      note,
      includeCustomizableMaps,
    });

    await sendAccessEmail(userRequestResponse.email, composedEmail);

    try {
      await context.pgClient.query(
        "select * from pf_public.pf_update_user_access_request ($1, $2, $3, $4)",
        [requestId, true, note, false],
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

export default acceptInvitation;
