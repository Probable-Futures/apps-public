import React from "react";
import { ApolloClient, ApolloProvider, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { useAuth0 } from "@auth0/auth0-react";

import { GRAPHQL, isProd } from "../consts/env";

export const AuthorizedApolloProvider = ({ children }: { children: React.ReactNode }) => {
  const { logout, getAccessTokenSilently } = useAuth0();

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
      const token = await getAccessTokenSilently();
      return {
        headers: {
          ...headers,
          Authorization: token ? `Bearer ${token}` : "",
        },
      };
    }
  });

  const apolloClient = new ApolloClient({
    link: authLink.concat(logoutLink).concat(httpLink),
    cache: new InMemoryCache(),
    connectToDevTools: !isProd,
  });

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
};
