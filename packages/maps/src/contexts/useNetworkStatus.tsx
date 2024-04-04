import { createContext, useContext, useState, useMemo, PropsWithChildren } from "react";

const NetworkStatusContext = createContext<NetworkStatus>({
  isLoading: false,
  setIsLoading: () => {},
});

export interface NetworkStatus {
  isLoading: boolean;
  setIsLoading(isLoading: boolean): void;
}

export default function useNetworkStatus(): NetworkStatus {
  return useContext(NetworkStatusContext);
}

export function NetworkStatusProvider(props: PropsWithChildren<{}>): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const networkStatus = useMemo<NetworkStatus>(() => ({ isLoading, setIsLoading }), [isLoading]);

  return (
    <NetworkStatusContext.Provider value={networkStatus}>
      {props.children}
    </NetworkStatusContext.Provider>
  );
}
