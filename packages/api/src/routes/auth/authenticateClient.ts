import express from "express";

import { ExpressRequestExtended } from ".";

export default function authenticateClient(
  req: ExpressRequestExtended,
  res: express.Response,
  next: Function,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res.status(401).send("Unauthorized");
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
  const [clientID, clientSecret] = credentials.split(":");

  if (!clientID || !clientSecret) {
    return res.status(401).send("Unauthorized");
  }

  req.clientId = clientID;
  req.clientSecret = clientSecret;

  next();
}
