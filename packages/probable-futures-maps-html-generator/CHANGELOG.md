# Changelog

All notable changes to this project will be documented in this file. Dates are displayed in UTC.

## 2.0.0 (breaking change)

> 02 Jun 2026

- **BREAKING:** `generateEmbedMap` no longer ships a hardcoded Mapbox access token. You must now pass your own `mapboxAccessToken`; the call throws if it is missing.
- feat: introduce an optional `mapStyleUrl` param on `generateEmbedMap` (format `mapbox://styles/{username}/{mapStyleId}`). Because the previous token only worked with Probable Futures' own map styles, callers using their own access token should provide a `mapStyleUrl` that points to a style in their own Mapbox account. When omitted, it falls back to the dataset's default Probable Futures style.

  **Migration:**

  ```diff
   const htmlTemplate = await generateEmbedMap({
     datasetId: 40101,
  +  mapboxAccessToken: MAPBOX_ACCESS_TOKEN,
  +  mapStyleUrl: "mapbox://styles/{username}/{mapStyleId}",
     viewState: { zoom: 4 },
     scenario: 2,
   });
  ```

## 1.0.0

> 04 Feb 2025

- feat: implement all functionalities for generating embeddable maps
