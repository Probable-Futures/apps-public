import React, { PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { Auth0Provider, AppState } from "@auth0/auth0-react";

import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE } from "../consts/env";

export default function AuthProvider({ children }: PropsWithChildren<{}>): JSX.Element {
  const domain = AUTH0_DOMAIN || "";
  const clientId = AUTH0_CLIENT_ID || "";

  const navigate = useNavigate();

  function onRedirectCallback(appState?: AppState) {
    navigate(appState?.returnTo || window.location.pathname);
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri={window.location.origin}
      onRedirectCallback={onRedirectCallback}
      audience={AUTH0_AUDIENCE}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
