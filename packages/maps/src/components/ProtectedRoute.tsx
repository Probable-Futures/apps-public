import { ComponentType } from "react";
import { withAuthenticationRequired, WithAuthenticationRequiredOptions } from "@auth0/auth0-react";

type Props = {
  component: ComponentType;
} & WithAuthenticationRequiredOptions;

export default function ProtectedRoute({ component, ...args }: Props) {
  const Component =
    process.env.NODE_ENV === "development"
      ? component
      : withAuthenticationRequired(component, args);
  return <Component />;
}
