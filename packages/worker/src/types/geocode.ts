export type Geodata = "latLon" | "cityCountry" | "fullAddress" | "addressOnly";

export type City = string;
export type Address = string;
export type Country = string;
export type GeocodeRequest = {
  country?: Country;
  city?: City;
  address?: Address;
};

export type GeocodeResults = {
  place_name: string;
  long: number;
  lat: number;
};

export type AddressRow = GeocodeRequest;

export type GeocodedAddressRow = AddressRow & GeocodeResults;

export type CountryCache = Map<City, GeocodeResults>;

export type GeoCache = Map<Country, CountryCache>;
