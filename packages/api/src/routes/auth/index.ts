import express from "express";

import { verify } from "../../services/auth/token";

const router = express.Router();

interface ExpressRequestExtended extends express.Request {
  clientId?: string;
  clientSecret?: string;
}

function authenticateClient(req: ExpressRequestExtended, res: express.Response, next: Function) {
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

router.get("/token", authenticateClient, async (req: ExpressRequestExtended, res) => {
  const { clientId, clientSecret } = req;

  if (!clientId || !clientSecret) {
    res.status(500).send("Missing clientId or clientSecret.");
    return;
  }

  try {
    const token = await verify(clientId, clientSecret);
    res.status(201).send({ ...token });
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  }
});

export default router;
