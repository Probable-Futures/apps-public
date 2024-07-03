import { verify } from "../../services/auth/token";
import createClient from "../../services/auth/client";
import sendAccessEmail, { composeEmail } from "./sendAccessEmail";
import { env } from "../../utils";
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
};

const getFormFieldValueByName = (name: string, formFields: Record<string, RequestField>) => {
  for (const key in formFields) {
    if (formFields.hasOwnProperty(key)) {
      const field = formFields[key];
      if (field.name === name) {
        return field.value;
      }
    }
  }
};

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

  // get the value of the "What would you like to use?" field.
  // const whatWouldYouLikeToUse: { id: string; name: string }[] =
  //   userRequestResponse.form_fields["fld56lzcRJPV9EDrW"].value;
  const whatWouldYouLikeToUse: { id: string; name: string }[] = getFormFieldValueByName(
    "What would you like to use?",
    userRequestResponse.form_fields,
  );
  const firstName = getFormFieldValueByName("First name", userRequestResponse.form_fields);
  const lastName = getFormFieldValueByName("Last name", userRequestResponse.form_fields);
  const fullName = `${firstName} ${lastName}`;
  // const fullName = `${userRequestResponse.form_fields["fldUF40ZB8gUYh8iY"].value} ${userRequestResponse.form_fields["fldAAYWSbPEk4QRRi"].value}`;

  try {
    const auth0ManagementToken = await verify(
      env.AUTH_MANAGEMENT_CLIENT_ID,
      env.AUTH_MANAGEMENT_CLIENT_SECRET,
      "https://" + env.AUTH0_DOMAIN + "/api/v2/",
    );

    let auth0Client: any;
    let password: any;

    let grantedAccessToPro = false;
    let includeCustomizableMaps = false;
    for (const item of whatWouldYouLikeToUse) {
      // if a user wants access to the Probable Futures API
      if (item.name === "Probable Futures API") {
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
        (item.name === "Probable Futures raw data" || item.name === "Probable Futures Pro")
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
          password = pfProAccessResponse.password;
        }
        grantedAccessToPro = true;
      } else if (item.name === "Probable Futures map tilesets (using Mapbox)") {
        includeCustomizableMaps = true;
      }
    }

    const composedEmail = composeEmail({
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(),
      authClient: auth0Client,
      authUser: response.userId
        ? { userId: response.userId, password, email: userRequestResponse.email }
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
