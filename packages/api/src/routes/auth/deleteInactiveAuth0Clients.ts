import request from "request";

import * as env from "../../utils/env";

const AUTH0_DOMAIN = "https://" + env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = "{AUTH0_CLIENT_ID}";
const AUTH0_CLIENT_SECRET = "{AUTH0_CLIENT_SECRET}";

const activeClients = [
  "cQ0FIITpM3MAXPaSOKI3RNCsMlLUk6Nu",
  "nn722R6i92CyN9k0M5kM9x6OCV2tZ1Mc",
  "xjsRVW0ZkJdiKjxSnIVrervOkaxn5800",
  "fwKZMlzbH9beluCTRdrDXvHg7YHce3do",
  "XYGs843HyeDtzpsEI4Iv05FUi5USiYmm",
  "EnbdLnzVFFYUp6s6BwJiyHb0pimKxjUS",
  "hlj3lHqSc1HIa9rW3qsgy4OU12uH6ili",
  "FQCzxCCBAh0wih1Yx0DFqheeldF0T6FD",
  "zdyNCJBLkiDKx8HIWRk2hUggnVdcO6X1",
  "321JndfuTE1GvvcpXJcjtl2NnPurYipt",
  "rITjwEwXTif71D6S68UhnAolVqy76dnL",
  "R7mCeXncliAqshicUGVEPV4NSR3Hfrq1",
  "mfKpA4iddVX8yaQtiZtXYndtlaD8admM",
  "zcSe6xwFfgVOLkNlF2cfqX9VsepxVvLc",
  "TlJdB4ZrSF2H7coU1T6YqNEHnpaZltxy",
  "93ECLtpXxHKZXSVbUtuK1o1gOTNh3uDE",
  "pJR3t2n88OIoU5xZeXxa1ctWdYDi2Ofq",
  "PoCvb8WGOapsnIkRNn5D2Lev51N6BqSU",
  "KAmWKNQ2z1DvoZLun0d6s55plGStpqlc",
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
async function listM2MApplications(managementApiToken): Promise<any> {
  return new Promise((resolve, reject) => {
    const options = {
      method: "GET",
      url: `${AUTH0_DOMAIN}/api/v2/clients`,
      headers: { Authorization: `Bearer ${managementApiToken}` },
    };

    request(options, function (error, response, body) {
      if (error) reject(error);
      const data = JSON.parse(body).filter((app) => app.app_type === "non_interactive");
      resolve(data);
    });
  });
}

// Function to delete an application by its client ID
async function deleteApplication(clientId, managementApiToken) {
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

async function main() {
  try {
    const managementApiToken = await getManagementApiToken();
    const m2mApps = await listM2MApplications(managementApiToken);

    const appsToDelete = m2mApps.filter((app) => !activeClients.includes(app.client_id));

    console.log({ appsToDelete: appsToDelete.length });
    console.log(appsToDelete.map((app) => ({ id: app.client_id, name: app.name })));

    for (const app of appsToDelete) {
      console.log(`Deleting application: ${app.name} (${app.client_id})`);
      await deleteApplication(app.client_id, managementApiToken);
    }
    console.log(appsToDelete.length);

    console.log("Deletion completed.");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
