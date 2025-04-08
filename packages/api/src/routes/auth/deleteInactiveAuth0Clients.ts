import request from "request";
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
];

// Function to get the Management API token
async function getManagementApiToken() {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      url: `${AUTH0_DOMAIN}/oauth/token`,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        audience: `${AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      }),
    };

    request(options, function (error, response, body) {
      if (error) reject(error);
      resolve(JSON.parse(body).access_token);
    });
  });
}

// Function to list all M2M applications
async function listM2MApplications(managementApiToken: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      url: `${AUTH0_DOMAIN}/api/v2/clients`,
      headers: { Authorization: `Bearer ${managementApiToken}` },
    };

    request(options, function (error, _response, body) {
      if (error) reject(error);
      const data = JSON.parse(body).filter((app: any) => app.app_type === "non_interactive");
      resolve(data);
    });
  });
}

// Function to delete an application by its client ID
async function deleteApplication(clientId: string, managementApiToken: string) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "DELETE",
      url: `${AUTH0_DOMAIN}/api/v2/clients/${clientId}`,
      headers: { Authorization: `Bearer ${managementApiToken}` },
    };

    request(options, function (error, response, body) {
      if (error) reject(error);
      resolve(true);
    });
  });
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
