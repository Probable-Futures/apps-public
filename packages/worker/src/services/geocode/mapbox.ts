import Bottleneck from "bottleneck";
import mbxClient from "@mapbox/mapbox-sdk/lib/client";
import mbxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";

import * as types from "../../types";
import { env } from "../../utils";

const debug = require("debug")("mapbox");

const limiter = new Bottleneck({
  reservoir: 600,
  reservoirRefreshAmount: 500,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 2,
  minTime: 200,
});

const baseClient = mbxClient({ accessToken: env.MAPBOX_ACCESS_TOKEN });
const geocodingService = mbxGeocoding(baseClient);

// Ensure that any reverse-geocoding-looking request is cleaned up
// so the server treats it as a forward geocoding request.
// https://github.com/mapbox/mapbox-gl-geocoder/blob/main/lib/index.js # edited
const REVERSE_GEOCODE_COORD_RGX = /^(-?\d{1,3}(\.\d{0,256})?)[, ]+(-?\d{1,3}(\.\d{0,256})?)?$/;
const setupConfig = (search: string, limit: number) => {
  const query = REVERSE_GEOCODE_COORD_RGX.test(search.trim()) ? search.replace(/,/g, " ") : search;
  return { limit, query };
};

const dbugMbxGeocodePlace = debug.extend("mbxGeocodePlace");
async function mbxGeocodePlace(query: string): Promise<types.GeocodeResults> {
  try {
    dbugMbxGeocodePlace("%o", { query });

    const config = setupConfig(query, 1);
    const response = await geocodingService.forwardGeocode(config).send();

    if (response.statusCode !== 200) {
      dbugMbxGeocodePlace("FAILED:: %o", { statusCode: response.statusCode, query });
      throw response;
    }

    if (response.body?.features.length === 0) {
      dbugMbxGeocodePlace("NO_RESULTS:: %o", { statusCode: response.statusCode, query });
      throw response;
    }

    const {
      place_name,
      center: [long, lat],
    } = response.body.features[0];

    return { place_name, long, lat };
  } catch (e: any) {
    console.error(e);
    return {
      place_name: "NOT FOUND",
      long: -9999,
      lat: -9999,
    };
  }
}

export const geocodeCity = limiter.wrap(mbxGeocodePlace);
