import { env } from "../../utils";
import { request } from "./request";

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

  let response = { client: {} as any };
  try {
    const client = await request<{
      client_id: string;
      client_secret: string;
      statusCode: number;
      error?: string;
      message: string;
    }>(clientData, "/api/v2/clients", auth0ManagementToken);

    if (client.statusCode !== 200 && client.statusCode !== 201 && client.error) {
      throw Error(client.message);
    }

    const grantsData = JSON.stringify({
      audience: env.AUTH0_AUDIENCE.replace(/\/$/, ""),
      client_id: client.client_id,
      scope: ["statistics:read"],
    });

    await request(grantsData, "/api/v2/client-grants", auth0ManagementToken);

    response.client = client;
  } catch (e) {
    console.error(e);
    throw e;
  }

  return response;
}

export default createClient;
