import { ComponentType, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  withAuthenticationRequired,
  useAuth0,
  WithAuthenticationRequiredOptions,
} from "@auth0/auth0-react";
import { useMutation } from "@apollo/client";
import Loader from "@probable-futures/components-lib/src/components/Loader";

import { AUTHENTICATE } from "../graphql/queries/users";
import { isProd } from "../consts/env";
import Error from "./Common/Error";
import { routes } from "../consts/dashboardConsts";
import { isAdmin } from "../utils/user";

type Props = {
  component: ComponentType;
} & WithAuthenticationRequiredOptions;

export default function ProtectedRoute({ component, ...args }: Props) {
  const { isLoading: auth0Loading, isAuthenticated, error: auth0Error, user } = useAuth0();
  const navigate = useNavigate();
  const [authenticateMutation, { loading: gqlLoading, error: apiError }] =
    useMutation(AUTHENTICATE);

  useEffect(() => {
    const authenticateServer = async (user: any) => {
      const { email, name } = user;
      await authenticateMutation({ variables: { email, name } });
    };

    if (isAuthenticated && user) {
      authenticateServer(user);
    }
  }, [user, isAuthenticated, authenticateMutation]);

  if (!user && !auth0Loading) {
    return <Navigate to="/" />;
  }

  if (user) {
    for (const route of routes) {
      const pathname = window.location.pathname;
      if (pathname.endsWith(route.path) && route.adminOnly) {
        if (!isAdmin(user)) {
          return <Navigate to="/" />;
        }
      }
    }
  }

  const goBackToLogin = () => navigate("/login");

  if (auth0Error || apiError) {
    const message = apiError ? apiError.message : auth0Error?.message;
    return (
      <Error
        title="Auth Error"
        description={message ?? ""}
        actionName="Go back to login"
        onButtonClicked={goBackToLogin}
      />
    );
  }

  if (auth0Loading || gqlLoading) {
    return (
      <div>
        <Loader show={true} />
      </div>
    );
  }

  const Component = !isProd
    ? component
    : withAuthenticationRequired(component, {
        ...args,
        ...{
          returnTo: `${window.location.origin}`,
        },
      });
  return <Component />;
}
