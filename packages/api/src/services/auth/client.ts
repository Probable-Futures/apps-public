import { env } from "../../utils";
import { request } from "./request";

export type AuthClient = {
  client_id: string;
  client_secret: string;
  statusCode: number;
  error?: string;
  message: string;
};

async function createClient(fullName: string, auth0ManagementToken: string) {
  const clientData = JSON.stringify({
    name: "API Access for " + fullName,
    grant_types: ["client_credentials"],
    token_endpoint_auth_method: "client_secret_post",
    app_type: "non_interactive",
    is_first_party: true,
    oidc_conformant: true,
    jwt_configuration: {
      lifetime_in_seconds: 36000,
      alg: "HS256",
    },
  });

  let response = { client: {} as AuthClient };
  try {
    const client = await request<AuthClient>(
      "/api/v2/clients",
      "POST",
      clientData,
      auth0ManagementToken,
    );

    const grantsData = JSON.stringify({
      audience: "https://" + env.AUTH0_DOMAIN.replace(/\/$/, "") + "/api/v2",
      client_id: client.client_id,
      scope: ["statistics:read"],
    });

    await request("/api/v2/client-grants", "POST", grantsData, auth0ManagementToken);

    response.client = client;
  } catch (e) {
    console.error(e);
    throw e;
  }

  return response;
}

export default createClient;
