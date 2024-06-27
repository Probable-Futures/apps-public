import express from "express";

import { verify } from "../../services/auth/token";
import { ExpressRequestExtended } from ".";
import { env } from "../../utils";

async function generateToken(req: ExpressRequestExtended, res: express.Response) {
  const { clientId, clientSecret } = req;

  if (!clientId || !clientSecret) {
    res.status(500).send("Missing clientId or clientSecret.");
    return;
  }

  try {
    const token = await verify(clientId, clientSecret, env.AUTH0_AUDIENCE.replace(/\/$/, ""));
    res.status(201).send({ ...token });
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
}

export default generateToken;
