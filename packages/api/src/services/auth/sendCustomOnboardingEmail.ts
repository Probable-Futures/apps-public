import sendAccessEmail from "./sendAccessEmail";

type AnyArg = { [arg: string]: any };

type RequestField = {
  name: string;
  value: any;
};

type Response = {
  success: boolean;
};

type UserRequestResponse = {
  email: string;
  form_fields: Record<string, RequestField>;
  form_name: string;
  id: string;
  access_granted: boolean;
};

const sendCustomOnboardingEmail = async (
  _query: AnyArg,
  args: AnyArg,
  context: AnyArg,
): Promise<Response> => {
  const { emailBody, requestId } = args.input;

  if (!emailBody) {
    throw Error("emailBody is missing.");
  }

  if (!requestId) {
    throw Error("requestId is missing.");
  }

  let rawUserRequestResponse,
    response: Response = { success: true };
  try {
    rawUserRequestResponse = await context.pgClient.query(
      "select id, email from pf_public.view_user_access_request where id = ($1)",
      [requestId],
    );
  } catch (error) {
    console.error(error);
    response.success = false;
  }

  const userRequestResponse = rawUserRequestResponse.rows[0] as UserRequestResponse;

  try {
    await sendAccessEmail(userRequestResponse.email, emailBody);
  } catch (e) {
    console.error(e);
    response.success = false;
  }

  try {
    await context.pgClient.query(
      "select pf_public.pf_update_user_access_request ($1, $2, $3, $4, $5, $6, $7, $8)",
      [userRequestResponse.id, null, null, null, null, null, emailBody, null],
    );
  } catch (error) {
    console.error(error);
    response.success = false;
  }

  return response;
};

export default sendCustomOnboardingEmail;
