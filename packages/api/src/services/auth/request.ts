import https from "https";

import { env } from "../../utils";

export const request = async <T>(
  data: string,
  path: string,
  auth0ManagementToken?: string,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: env.AUTH0_DOMAIN,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...(auth0ManagementToken && { Authorization: "Bearer " + auth0ManagementToken }),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        resolve(JSON.parse(responseData || "{}"));
      });
    });

    req.on("error", (error) => {
      reject(new Error("Error getting token"));
    });

    req.write(data);
    req.end();
  });
};
