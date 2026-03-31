import { Fragment } from "react";

import Error from "./Common/Error";

const ErrorBoundaryFallback = ({
  error,
}: {
  error: unknown;
  componentStack: string;
  eventId: string;
  resetError(): void;
}) => {
  const onClick = () => window.location.reload();

  return (
    <Fragment>
      <Error
        title="You have encountered an error!"
        description={
          error instanceof globalThis.Error ? error.message || error.toString() : String(error)
        }
        actionName="Close and reload"
        onButtonClicked={onClick}
      />
    </Fragment>
  );
};

export default ErrorBoundaryFallback;
