import { MapRef } from "react-map-gl";
import { Feature, options } from "../../../components-lib/src/hooks/useGeocoder";

export const exceptions = {
  fr: {
    name: "France",
    bbox: [
      [-4.59235, 41.380007],
      [9.560016, 51.148506],
    ],
  },
  us: {
    name: "United States",
    bbox: [
      [-171.791111, 18.91619],
      [-66.96466, 71.357764],
    ],
  },
  ru: {
    name: "Russia",
    bbox: [
      [19.66064, 41.151416],
      [190.10042, 81.2504],
    ],
  },
  ca: {
    name: "Canada",
    bbox: [
      [-140.99778, 41.675105],
      [-52.648099, 83.23324],
    ],
  },
};

// https://github.com/mapbox/mapbox-gl-geocoder/blob/main/lib/index.js # edited
export const setupConfig = (search: string, limit: number, language = "en") => {
  let config = { limit, language: [language] };

  // Ensure that any reverse geocoding looking request is cleaned up
  // to be processed as only a forward geocoding request by the server.
  const trimmedSearch = search.trim();
  const reverseGeocodeCoordRgx = /^(-?\d{1,3}(\.\d{0,256})?)[, ]+(-?\d{1,3}(\.\d{0,256})?)?$/;
  if (reverseGeocodeCoordRgx.test(trimmedSearch)) {
    search = search.replace(/,/g, " ");
  }
  config = { ...config, ...{ query: search } };

  return config;
};
interface FlyProps {
  feature: Feature;
  mapRef: React.RefObject<MapRef>;
  onFly?: (arg: Feature) => void;
}

//https://github.com/mapbox/mapbox-gl-geocoder/blob/main/lib/exceptions.js
export const fly = (props: FlyProps) => {
  const { feature, mapRef, onFly } = props;

  const map = mapRef.current?.getMap();
  if (!map?.flyTo && !map?.fitBounds) {
    if (onFly) {
      return onFly(feature);
    }
    return;
  }
  const shortCode = (
    feature.properties?.short_code === "string" ? feature.properties?.short_code : ""
  ) as keyof typeof exceptions;
  if (exceptions[shortCode]) {
    if (map) {
      map.fitBounds(exceptions[shortCode].bbox, {});
    }
  } else if (feature.bbox) {
    const bbox = feature.bbox;
    if (map) {
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        {},
      );
    }
  } else {
    let flyOptions: { center?: number[][] | number[] | any; zoom?: number } = {
      zoom: options.defaultZoom,
    };
    if (feature.center) {
      flyOptions.center = feature.center;
    } else if (
      feature.geometry &&
      feature.geometry.type &&
      feature.geometry.type === "Point" &&
      feature.geometry.coordinates
    ) {
      flyOptions.center = feature.geometry.coordinates;
    }

    if (map) {
      map.flyTo(flyOptions);
    }
  }
  if (onFly) {
    onFly(feature);
  }
};
