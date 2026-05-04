/**
 * UNIT TESTS — src/services/geocode/geocode.ts
 *
 * Mocks:
 *   - src/database (redisClient.HGETALL / HSET) → control cache hit/miss
 *   - src/services/geocode/mapbox (geocodeCity) → don't call Mapbox over HTTP
 *
 * Bug surface this file targets:
 *   - Recent fix (commit 27c3a6d3): state must be included in the Mapbox query
 *     to disambiguate cities with the same name. Verified by spying on the
 *     query string passed to geocodeCity.
 *   - Cache key shape: `${query} - v${CACHE_VERSION}`. Bumping CACHE_VERSION is
 *     the standard cache-bust knob; tests pin its current value via the redis
 *     key written on a miss.
 *   - Cache HIT path: must NOT call mapbox at all.
 */
const HGETALL = jest.fn(async () => ({} as Record<string, string>));
const HSET = jest.fn(async () => 1);
const geocodeCity = jest.fn();

jest.mock("../../../src/database", () => ({
  redisClient: { HGETALL, HSET, on: jest.fn(), connect: jest.fn() },
  rootPgPool: { connect: jest.fn(), on: jest.fn(), query: jest.fn() },
  authPgPool: { connect: jest.fn(), on: jest.fn(), query: jest.fn() },
  healthCheck: jest.fn(),
  ownerConnectionString: "postgres://test",
}));

jest.mock("../../../src/services/geocode/mapbox", () => ({
  geocodeCity: (...args: unknown[]) => geocodeCity(...args),
}));

import mbxGeocode from "../../../src/services/geocode/geocode";

beforeEach(() => {
  HGETALL.mockReset();
  HSET.mockReset();
  geocodeCity.mockReset();
  HGETALL.mockResolvedValue({});
  HSET.mockResolvedValue(1);
});

describe("mbxGeocode()", () => {
  it("builds a comma-joined, lowercased query in [address, city, state, country] order", async () => {
    geocodeCity.mockResolvedValue({ place_name: "Springfield, IL", long: -89.6, lat: 39.8 });

    await mbxGeocode({
      address: "742 Evergreen Terrace",
      city: "Springfield",
      state: "Illinois",
      country: "USA",
    });

    expect(geocodeCity).toHaveBeenCalledWith("742 evergreen terrace,springfield,illinois,usa");
  });

  it("includes state in the query — guards the regression that motivated the recent fix", async () => {
    geocodeCity.mockResolvedValue({ place_name: "Springfield, IL", long: 0, lat: 0 });

    await mbxGeocode({ city: "Springfield", state: "Illinois", country: "USA" });

    const queryArg = geocodeCity.mock.calls[0][0] as string;
    expect(queryArg).toContain("illinois");
  });

  it("omits empty fields rather than producing leading/trailing commas", async () => {
    geocodeCity.mockResolvedValue({ place_name: "Paris", long: 2.35, lat: 48.85 });

    await mbxGeocode({ city: "Paris", country: "France" });

    expect(geocodeCity).toHaveBeenCalledWith("paris,france");
  });

  it("returns the mapbox result on a cache MISS and writes it to redis under v2", async () => {
    HGETALL.mockResolvedValue({});
    geocodeCity.mockResolvedValue({ place_name: "Beirut", long: 35.5, lat: 33.9 });

    const out = await mbxGeocode({ city: "Beirut", country: "Lebanon" });

    expect(out).toEqual({ place_name: "Beirut", long: 35.5, lat: 33.9 });
    expect(HSET).toHaveBeenCalledTimes(1);
    const [keyNs, redisKey, value] = HSET.mock.calls[0];
    expect(keyNs).toBe("geocode");
    expect(redisKey).toBe("beirut,lebanon - v2");
    expect(JSON.parse(value as string)).toEqual({
      place_name: "Beirut",
      long: 35.5,
      lat: 33.9,
    });
  });

  it("returns the cached value on a cache HIT and does NOT call mapbox", async () => {
    const cached = { place_name: "Cairo", long: 31.2, lat: 30.0 };
    HGETALL.mockResolvedValue({ "cairo,egypt - v2": JSON.stringify(cached) });

    const out = await mbxGeocode({ city: "Cairo", country: "Egypt" });

    expect(out).toEqual(cached);
    expect(geocodeCity).not.toHaveBeenCalled();
    expect(HSET).not.toHaveBeenCalled();
  });

  it("treats the cache as miss when the key under a different version exists", async () => {
    // A v1 entry must NOT satisfy a v2 lookup. This is the whole point of CACHE_VERSION.
    HGETALL.mockResolvedValue({ "cairo,egypt - v1": JSON.stringify({ stale: true }) });
    geocodeCity.mockResolvedValue({ place_name: "Cairo", long: 31.2, lat: 30.0 });

    await mbxGeocode({ city: "Cairo", country: "Egypt" });

    expect(geocodeCity).toHaveBeenCalledTimes(1);
  });

  it("handles a totally empty input (returns whatever mapbox says, with empty query)", async () => {
    geocodeCity.mockResolvedValue({ place_name: "NOT FOUND", long: -9999, lat: -9999 });

    const out = await mbxGeocode({});

    expect(geocodeCity).toHaveBeenCalledWith("");
    expect(out).toEqual({ place_name: "NOT FOUND", long: -9999, lat: -9999 });
  });
});
