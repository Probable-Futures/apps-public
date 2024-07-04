import generator from "generate-password";

import { request } from "./request";
import { env } from "../../utils";

type AuthUser = {
  email: string;
  email_verified: boolean;
  identities: any[];
  name: string;
  nickname: string;
  picture: string;
  user_id: string;
  statusCode: number;
  error?: string;
  message: string;
  errorCode?: string;
};

const grantPfProAccess = async (email: string, name: string, auth0ManagementToken: string) => {
  const password = generator.generate({
    numbers: true,
    symbols: true,
    uppercase: true,
    lowercase: true,
    length: 14,
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

  let response: { password: string; user: AuthUser; alreadyExists: boolean } = {
    password: "",
    user: {} as AuthUser,
    alreadyExists: false,
  };
  try {
    const user = await request<AuthUser>("/api/v2/users", "POST", userData, auth0ManagementToken);
    let existingUser: AuthUser | undefined = undefined;

    const rolesData = JSON.stringify({
      roles: [env.AUTH_FULL_USER_ROLE_ID],
    });

    // if the user already exists make sure he has the required permissions to access pf pro
    if (user.message === "The user already exists." || user.error === "Conflict") {
      const existingUsers = await request<AuthUser[]>(
        `/api/v2/users-by-email?email=${email}`,
        "GET",
        "",
        auth0ManagementToken,
      );
      if (existingUsers?.length > 0) {
        existingUser = existingUsers.find((u) => !u.identities[0].isSocial);
        if (existingUser) {
          const existingUserRoles = await request<any>(
            `/api/v2/users/${existingUser.user_id}/roles`,
            "GET",
            "",
            auth0ManagementToken,
          );
          if (
            !existingUserRoles.find(
              (ur: { name: string }) => ur.name.trim() === env.AUTH_FULL_USER_ROLE_ID.trim(),
            )
          ) {
            await request(
              `/api/v2/users/${user.user_id}/roles`,
              "POST",
              rolesData,
              auth0ManagementToken,
            );
          }
        }
      }
    } else {
      await request(`/api/v2/users/${user.user_id}/roles`, "POST", rolesData, auth0ManagementToken);
    }

    response.alreadyExists = !!existingUser;
    response.user = existingUser ?? user;
    response.password = password;
  } catch (e) {
    console.error(e);
    throw e;
  }

  return response;
};

export default grantPfProAccess;
