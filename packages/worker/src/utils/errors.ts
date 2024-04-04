import { Logger } from "../types";

type ErrorConstructor = {
  message: string;
  error?: any;
};

export class ApplicationError extends Error {
  private originalError?: any;

  constructor({ message, error }: ErrorConstructor) {
    super(message);
    this.name = "ApplicationError";
    this.originalError = error;
  }
}

export class UnhandledException extends ApplicationError {
  constructor(message: string) {
    super({ message });
    this.name = "UnhandledException";
  }
}

export class ValidationError extends ApplicationError {
  invalidData?: any;

  constructor({ message, invalidData }: { message: string; invalidData?: any }) {
    super({ message });
    this.invalidData = invalidData;
    this.name = "ValidationError";
  }
}

export const throwApplicationError =
  ({ message, context, logger }: { message: string; context?: object; logger?: Logger }) =>
  (error: Error) => {
    if (logger) {
      logger.error(message, {
        error,
        ...context,
      });
    }

    return new ApplicationError({ message, error });
  };
