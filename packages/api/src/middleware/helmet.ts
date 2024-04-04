import { Express } from "express";
import helmet from "helmet";

export default (app: Express) => {
  app.use(helmet());
};
