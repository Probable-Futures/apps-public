import { PoolClient } from "pg";
import { Logger as WorkerLogger, WithPgClient, AddJobFunction } from "graphile-worker";
import { Logger as PinoLogger } from "pino";

export type Logger = WorkerLogger | PinoLogger;

export interface Provider {
  logger: Logger;
  pg: PoolClient;
  withPgClient: WithPgClient;
  addJob: AddJobFunction;
}
