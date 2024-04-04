type IndexForMapType = {
  minBin: number;
  maxBin: number;
  landColor: string;
  oceanColor: string;
};

export const indexForMap: IndexForMapType = {
  minBin: 0,
  maxBin: 365,
  landColor: "#e6e6e6",
  oceanColor: "#f5f5f5",
};

export const MAP_QUERY_PARAM = "selected_map";

export const OLD_MAP_VERSION_QUERY_PARAM = "map_version";
export const MAP_VERSION_QUERY_PARAM = "version";

export const OLD_MAP_PROJECTION_QUERY_PARAM = "map_projection";
export const MAP_PROJECTION_QUERY_PARAM = "view";

export const OLD_WARMING_SCENARIO_QUERY_PARAM = "warming_scenario";
export const WARMING_SCENARIO_QUERY_PARAM = "scenario";

export const VOLUME_QUERY_PARAM = "volume"; // not used anymore, kept here in order to remove from the url if it exists.

export const MARKER_SIZES = {
  small: 30,
  medium: 86,
  large: 103,
};
export const POPUP_DEFAULT_LOCATION: [number, number] = [77.98, 32.175];
