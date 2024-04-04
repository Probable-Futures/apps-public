import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense } from "react";
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { useAuth0 } from "@auth0/auth0-react";

import { NetworkStatusProvider } from "./contexts/useNetworkStatus";
import MapBuilder from "./screens/MapBuilder";
import PublicMaps from "./screens/PublicMaps";
import Login from "./screens/Login";
import CompareMaps from "./screens/CompareMaps";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./components/AuthProvider";
import { TranslationLoader, TranslationProvider } from "./contexts/TranslationContext";

export default function App(): JSX.Element {
  const { logout } = useAuth0();

  const httpLink = createHttpLink({
    uri: window.pfInteractiveMap?.pfApiUrl || process.env.REACT_APP_GRAPHQL,
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

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        "api-key": window.pfInteractiveMap?.pfApiKey || process.env.REACT_APP_GRAPHQL_API_KEY,
      },
    };
  });

  const client = new ApolloClient({
    link: authLink.concat(logoutLink).concat(httpLink),
    cache: new InMemoryCache(),
  });

  if (window.pfInteractiveMap) {
    return (
      <Router>
        <ApolloProvider client={client}>
          <TranslationProvider>
            <TranslationLoader />
            <PublicMaps />
          </TranslationProvider>
        </ApolloProvider>
      </Router>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <ApolloProvider client={client}>
          <TranslationProvider>
            <NetworkStatusProvider>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" Component={Login} />
                  <Route path="/:language" element={<TranslationLoader />}>
                    <Route path="maps" element={<ProtectedRoute component={PublicMaps} />} />
                    <Route path="compare" element={<ProtectedRoute component={CompareMaps} />} />
                    <Route path="mapBuilder" element={<ProtectedRoute component={MapBuilder} />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Suspense>
            </NetworkStatusProvider>
          </TranslationProvider>
        </ApolloProvider>
      </AuthProvider>
    </Router>
  );
}
