import express from "express";

import generateToken from "./generateToken";
import authenticateClient from "./authenticateClient";

export interface ExpressRequestExtended extends express.Request {
  clientId?: string;
  clientSecret?: string;
}

const router = express.Router();

router.get("/token", authenticateClient, generateToken);

export default router;
