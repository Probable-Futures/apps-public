/*
 * This script is designed to clean up inactive Machine-to-Machine (M2M) applications in our Auth0 tenant.
 * 1. Set the environment variables in the .env file for the Auth0 Management API credentials.
 * 2. RUN yarn workspace @probable-futures/api delete-inactive-auth-applications
 *
 * IMPORTANT - before running the script:
 * Before you run the script we need to check the list of the clients that are going to be deleted and make sure that they are not active. The script will log the clients that are going to be deleted, so please review the logs before confirming the deletion.
 * 1. Comment out the line "await deleteApplication(app.client_id, managementApiToken);" in the main function.
 * 2. Run the script and review the logs to see which clients are marked for deletion.
 * 3. Confirm that the clients listed in the logs are indeed inactive by running the following query:
 * select distinct user_sub from pf_private.pf_audit where user_sub in ('client_id_1', 'client_id_2', ...);
 * 4. The clients that do not appear in the query results are inactive and can be safely deleted. pf_private.pf_audit table contains logs of all the authentication events, and they get automatically deleted after 6 months, so if a client_id does not appear in the results, it means that it has not been used for authentication in the last 6 months.
 * 5. Once you have confirmed the inactive clients, uncomment the line "await deleteApplication(app.client_id, managementApiToken);" and run the script again to proceed with the deletion.
 *
 * TODO: Automate the whole process in two stages:
 * 1. This script should automatically check SQL for the client_ids that have not been used in the last 6 months and delete them without logging.
 * 2. Optional, but we could have an automated job that runs this script every 6 months and sends a report of the deleted clients to the team.
 */

import fetch from "node-fetch";

import * as env from "../../utils/env";

const AUTH0_DOMAIN = "https://" + env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = env.AUTH_MANAGEMENT_CLIENT_ID;
const AUTH0_CLIENT_SECRET = env.AUTH_MANAGEMENT_CLIENT_SECRET;

const activeClients = [
  "cQ0FIITpM3MAXPaSOKI3RNCsMlLUk6Nu",
  "hlj3lHqSc1HIa9rW3qsgy4OU12uH6ili", // (Api Access for the AI Assistant)
  "321JndfuTE1GvvcpXJcjtl2NnPurYipt",
  "pJR3t2n88OIoU5xZeXxa1ctWdYDi2Ofq", // (auth0-management)
  "KAmWKNQ2z1DvoZLun0d6s55plGStpqlc", // (logs-to-cloudwatch)
  "pTBmRgiknkDrvE0oXHaj3uL8ftIRoPI5", // factbook

  // new ones retrieved by running: "select user_sub, count(*) from pf_private.pf_audit group by user_sub;"
  "yb6Pt1TVIpjlYpUAauc7ikfUw6o3Y3EG", //(PF Docs API Access)
  "pTBmRgiknkDrvE0oXHaj3uL8ftIRoPI5", //(Factbook Api Access)
  "91nwrm4k2Es2PMZI5B0pxUOEa2loMQdW", //(API Access for Vaibhav)
  "a9QuDEFMF2pGGr4jm5OvzScUp3WTve0I", //(API Access for Munyaradzi Mukungunugwa)
  "DOi7AQIZCJbQHaUF8qNQzSbJslLjtkLY", //(API Access for Ali Kalout)
  "sO35tshUgLPTIcuSGjQbPmuhVlNyrTEi", //(API Access for Matheus Patrício Monteiro)
  "R7mCeXncliAqshicUGVEPV4NSR3Hfrq1", //(API Access for Alexander Liss)
  "tTAbahVkAaYqB8sonDP8cVWAP00tgGiS", //(API Access for Peter Croce)
  "0W2dINdF3IyDBXGcQHICftxNmsfzs9yA", //For Airtable
  "BF0JagTw5Z5m9yfkTQzDCwBTVK2ZlX55", //(API Access for the AI Agent)
];

// Function to get the Management API token
async function getManagementApiToken() {
  const response = await fetch(`${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: `${AUTH0_DOMAIN}/api/v2/`,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get management token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

// Function to list all M2M applications
async function listM2MApplications(managementApiToken: string): Promise<any> {
  const response = await fetch(`${AUTH0_DOMAIN}/api/v2/clients`, {
    method: "GET",
    headers: { Authorization: `Bearer ${managementApiToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to list clients: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.filter((app: any) => app.app_type === "non_interactive");
}

// Function to delete an application by its client ID
async function deleteApplication(clientId: string, managementApiToken: string) {
  const response = await fetch(`${AUTH0_DOMAIN}/api/v2/clients/${clientId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${managementApiToken}` },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to delete client ${clientId}: ${response.status} ${response.statusText}`,
    );
  }

  return true;
}

async function getRecentAppRequests() {
  const allRecords = [];
  let offset = null;

  do {
    const params: string = offset ? `?offset=${offset}` : "";
    const url = `https://api.airtable.com/v0/${env.AIRTABLE_DATA_OFFERINGS_BASE_ID}/${env.AIRTABLE_DATA_OFFERINGS_TABLE_ID}${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.AIRTABLE_ACCESS_TOKEN_FOR_DATA_OFFERRINGS}`,
      },
    });

    const data = await response.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  // Get current date and 6 months ago date
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const recentRequests = allRecords.filter((record: any) => {
    const requestDate = new Date(record.fields["Requested on"]);
    return requestDate >= sixMonthsAgo;
  });

  return recentRequests.map((record: any) => {
    return `API Access for ${record.fields["First name"] + " " + record.fields["Last name"]}`;
  });
}

async function main() {
  try {
    const managementApiToken = (await getManagementApiToken()) as string;
    const recentAppRequests: string[] = await getRecentAppRequests();
    const m2mApps = await listM2MApplications(managementApiToken);

    const appsToDelete = m2mApps.filter(
      (app: any) => !activeClients.includes(app.client_id) && !recentAppRequests.includes(app.name),
    );

    for (const app of appsToDelete) {
      console.log(`Deleting application: ${app.name} (${app.client_id})`);
      await deleteApplication(app.client_id, managementApiToken);
    }
    console.log("Deletion completed.");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
