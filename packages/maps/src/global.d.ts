export {};

declare global {
  interface Window {
    pfInteractiveMap?: {
      appSelector: string;
      wpApiUrl: string;
      mapboxAccessToken: string | null;
      pfApiUrl: string | null;
      pfApiKey: string | null;
    };
    AppAnalytics?: {
      track: (eventName: string, props?: Record<string, any>) => void;
    };
  }
}
