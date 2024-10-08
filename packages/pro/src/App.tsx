import { Provider } from "react-redux";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import * as Sentry from "@sentry/react";

import Login from "./screens/Login";
import Consent from "./screens/Consent";
import NotFound from "./screens/NotFound";
import { store } from "./store/store";
import ErrorBoundaryFallback from "./components/ErrorBoundaryFallback";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./components/AuthProvider";
import { AuthorizedApolloProvider } from "./components/AuthorizedApolloProvider";
import { routes as dashboardRoutes } from "./consts/dashboardConsts";
import React from "react";

const Map = React.lazy(() => import("./screens/Map"));
const Dashboard = React.lazy(() => import("./screens/Dashboard"));

export const App = () => {
  return (
    <Sentry.ErrorBoundary fallback={ErrorBoundaryFallback}>
      <Router>
        <AuthProvider>
          <AuthorizedApolloProvider>
            <Provider store={store}>
              <Routes>
                <Route path="/" Component={Login} />
                <Route path="/consent" Component={Consent} />
                <Route path="/dashboard" element={<ProtectedRoute component={Dashboard} />}>
                  {dashboardRoutes.map(
                    (route, index) =>
                      route.component && (
                        <Route key={index} path={route.path} Component={route.component} />
                      ),
                  )}
                  <Route path="" element={<Navigate to="documentation" />} />
                </Route>
                <Route path="/map" Component={Map} />
                <Route path="/share" Component={Map} />
                <Route path="/not-found" Component={NotFound} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Provider>
          </AuthorizedApolloProvider>
        </AuthProvider>
      </Router>
    </Sentry.ErrorBoundary>
  );
};
export default App;
