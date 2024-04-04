import { PropsWithChildren } from "react";
import { useNavigate } from "react-router-dom";
import { Auth0Provider, AppState } from "@auth0/auth0-react";

export default function AuthProvider({ children }: PropsWithChildren<{}>): JSX.Element {
  const domain = process.env.REACT_APP_AUTH0_DOMAIN || "";
  const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID || "";

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
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
