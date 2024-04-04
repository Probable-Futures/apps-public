import { Fragment } from "react";

import Error from "./Common/Error";

const ErrorBoundaryFallback = ({
  error,
}: {
  error: Error | null;
  componentStack: string | null;
}) => {
  const onClick = () => window.location.reload();

  return (
    <Fragment>
      <Error
        title="You have encountered an error!"
        description={error?.toString() ?? ""}
        actionName="Close and reload"
        onButtonClicked={onClick}
      />
    </Fragment>
  );
};

export default ErrorBoundaryFallback;
