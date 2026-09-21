import React, { useRef } from "react";
import { ApolloClient, ApolloProvider, createHttpLink, from, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { useAuth0 } from "@auth0/auth0-react";
import * as Sentry from "@sentry/react";

import { GRAPHQL, isProd } from "../consts/env";

export const AuthorizedApolloProvider = ({ children }: { children: React.ReactNode }) => {
  const { logout, getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const isRedirectingRef = useRef(false);

  const httpLink = createHttpLink({
    uri: GRAPHQL,
  });

  const logoutLink = onError(({ networkError }) => {
    if (
      networkError &&
      "statusCode" in networkError &&
      (networkError.statusCode === 401 || networkError.statusCode === 403)
    ) {
      logout();
    }
  });

  const authLink = setContext(async (_, { headers }) => {
    if (headers && headers["api-key"]) {
      return {
        headers: {
          ...headers,
        },
      };
    } else {
      let token = "";
      try {
        token = await getAccessTokenSilently();
      } catch (e: any) {
        if (e.error === "login_required" || e.error === "consent_required") {
          if (!isRedirectingRef.current) {
            isRedirectingRef.current = true;
            loginWithRedirect({
              appState: { returnTo: window.location.pathname + window.location.search },
            });
          }
        } else {
          Sentry.captureException(e);
        }
        throw e;
      }
      return {
        headers: {
          ...headers,
          Authorization: token ? `Bearer ${token}` : "",
        },
      };
    }
  });

  const apolloClient = new ApolloClient({
    link: from([logoutLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    connectToDevTools: !isProd,
  });

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};
