import { Geodata } from "../components/Dashboard/Project/MergeData";

export const requiredCsvHeaders: Record<Geodata, string[][]> = {
  latLon: [
    ["lat", "lon"],
    ["lat", "lng"],
    ["latitude", "longitude"],
  ],
  fullAddress: [["address", "country"]],
  cityCountry: [["city", "country"]],
};
