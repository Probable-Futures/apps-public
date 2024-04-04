import * as types from "../../types";
import * as mapbox from "./mapbox";
import { redisClient } from "../../database";

const debug = require("debug")("geocode");

const KEY = "geocode";
const CACHE_VERSION = "2";

export default async function mbxGeocode(place: types.AddressRow): Promise<types.GeocodeResults> {
  debug("Input: %o", place);
  let results: types.GeocodeResults;
  const { city, country, address } = place;
  const countryToLower = (country || "").toLowerCase();
  const cityToLower = (city || "").toLowerCase();
  const addressToLower = (address || "").toLowerCase();

  const query: string[] = [];
  if (addressToLower) {
    query.push(addressToLower);
  }
  if (cityToLower) {
    query.push(cityToLower);
  }
  if (countryToLower) {
    query.push(countryToLower);
  }
  const queryToString = query.join(",");
  const redisKey = `${queryToString} - v${CACHE_VERSION}`;

  const cache = await redisClient.HGETALL(KEY);

  if (!cache[redisKey]) {
    results = await mapbox.geocodeCity(queryToString);
    redisClient.HSET(KEY, redisKey, JSON.stringify(results));
  } else {
    results = JSON.parse(cache[redisKey]) as types.GeocodeResults;
  }
  const geocoded = { ...results };

  debug("Output: %o", geocoded);
  return geocoded;
}
