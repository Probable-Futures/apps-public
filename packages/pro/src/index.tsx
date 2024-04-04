import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import { BrowserOptions } from "@sentry/browser";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App";
import { DEPLOY_ENV, isProd } from "./consts/env";
import { enableAutoPageviews } from "./utils/analytics";

import * as serviceWorker from "./serviceWorker";

const SENTRY_DSN = "https://beeac1c3164d4869a16e7e85996715ca@o542309.ingest.sentry.io/5806361";

const sentryConf: BrowserOptions = {
  enabled: isProd,
  dsn: SENTRY_DSN,
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 0.5,
  environment: DEPLOY_ENV,
};

Sentry.init(sentryConf);

enableAutoPageviews();

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(<App />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
