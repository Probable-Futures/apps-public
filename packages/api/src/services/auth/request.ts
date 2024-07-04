import https from "https";

import { env } from "../../utils";

export const request = async <T>(
  path: string,
  method: "GET" | "POST",
  data: string = "",
  auth0ManagementToken?: string,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: env.AUTH0_DOMAIN,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(method === "POST" && { "Content-Length": Buffer.byteLength(data) }),
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

    if (method === "POST") {
      req.write(data);
    }
    req.end();
  });
};
