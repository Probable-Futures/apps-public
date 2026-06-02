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

## 1.0.41 (breaking change if you are using any of SimpleMap or CompareMap components)

> 07 Jan 2025

- feat: Introduce mapStyleUrl as a prop to the SimpleMap and CompareMap components.

## 1.0.40

> 05 Dec 2024

- feat: provide two additional react components SimpleMap and CompareMap. These components can be used in a website to render PF embeddable maps.

## 1.0.38

> 30 Sept 2024

- docs: create changelog file to target changes across versions

## 1.0.0

> 11 Sept 2023

- feat: implement all functionalities for generating embeddable maps
