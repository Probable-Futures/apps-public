import React from "react";
import mapboxgl from "mapbox-gl";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import "mapbox-gl/dist/mapbox-gl.css";
import { createRoot } from "react-dom/client";

import App from "./App";
import * as serviceWorker from "./serviceWorker";
import GlobalStyles from "./globalStyles";
import "./fonts.css";

// https://github.com/mapbox/mapbox-gl-js/issues/10173
// @ts-ignore
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require("worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker").default;

Sentry.init({
  enabled: process.env.NODE_ENV === "production" && !window.pfInteractiveMap,
  dsn: "https://5bb7edd4789c4cbeb5c019fb9c8e2472@o542309.ingest.sentry.io/5661865",
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 0.5,
  environment: process.env.REACT_APP_DEPLOY_ENV,
});

const { appSelector = "#root" } = window.pfInteractiveMap || {};

const root = createRoot(document.querySelector(appSelector) as HTMLElement);
root.render(
  <React.StrictMode>
    <GlobalStyles />
    <App />
  </React.StrictMode>,
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
