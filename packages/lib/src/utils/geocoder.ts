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
