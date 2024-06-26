import generator from "generate-password";

import { request } from "./request";
import { env } from "../../utils";

const grantPfProAccess = async (email: string, name: string, auth0ManagementToken: string) => {
  const password = generator.generate({
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
    length: 10,
  });
  const userData = JSON.stringify({
    email,
    user_metadata: {},
    blocked: false,
    email_verified: true,
    name,
    connection: env.AUTH_PRO_CLIENT_USER_DB_CONNECTION_NAME,
    verify_email: false,
    password,
  });

  let response: { password: string; userId: string } = { password: "", userId: "" };
  try {
    const user = await request<{
      email: string;
      email_verified: boolean;
      identities: any[];
      name: string;
      nickname: string;
      picture: string;
      user_id: string;
    }>(userData, "/api/v2/users", auth0ManagementToken);

    const rolesData = JSON.stringify({
      roles: [env.AUTH_FULL_USER_ROLE_ID],
    });

    await request(rolesData, `/api/v2/users/${user.user_id}/roles`, auth0ManagementToken);

    response.userId = user.user_id;
    response.password = password;
  } catch (e) {
    console.error(e);
    throw e;
  }

  return response;
};

export default grantPfProAccess;
