import express, { Request, Response, NextFunction } from "express";

import * as env from "../utils/env";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log("Here are the headers received from every.org: ", authHeader);
  const token = authHeader && authHeader.split(" ")[1];
  console.log("Here is the token received from every.org: ", token);

  next();
  // if (!token) {
  // return res.status(401).send({ error: "Authorization token not found." });
  // }

  // if (token === env.EVERY_DOT_ORG_ACCESS_TOKEN) {
  // next();
  // } else {
  // res.status(401).send({ error: "Unauthorized access. Invalid token." });
  // }
};
