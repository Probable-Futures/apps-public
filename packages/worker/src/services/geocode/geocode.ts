import * as types from "../../types";
import * as mapbox from "./mapbox";
import { redisClient } from "../../database";

const debug = require("debug")("geocode");

const CACHE_VERSION = "3";
const KEY = `geocode:v${CACHE_VERSION}`;

export default async function mbxGeocode(place: types.AddressRow): Promise<types.GeocodeResults> {
  debug("Input: %o", place);
  const { city, state, country, address } = place;

  const queryToString = [address, city, state, country]
    .map((part) => (part || "").toLowerCase())
    .filter(Boolean)
    .join(",");

  const cached = await redisClient.HGET(KEY, queryToString);

  let results: types.GeocodeResults;
  if (cached) {
    results = JSON.parse(cached) as types.GeocodeResults;
  } else {
    results = await mapbox.geocodeCity(queryToString);
    await redisClient.HSET(KEY, queryToString, JSON.stringify(results));
  }

  debug("Output: %o", results);
  return results;
}
