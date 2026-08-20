import { consts } from "@probable-futures/lib";

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

export const SCENARIO_BEFORE_QUERY_PARAM = "scenario_before";
export const SCENARIO_AFTER_QUERY_PARAM = "scenario_after";

export type ComparisonMode = "none" | "swipe" | "diff";

export const COMPARE_MODE_QUERY_PARAM = "compare";
export const VERSION_BEFORE_QUERY_PARAM = "version_before";
export const VERSION_AFTER_QUERY_PARAM = "version_after";

export const parseComparisonMode = (value: string | null): ComparisonMode | undefined =>
  value === "swipe" || value === "diff" ? value : undefined;

export const VOLUME_QUERY_PARAM = "volume"; // not used anymore, kept here in order to remove from the url if it exists.

export const POPUP_DEFAULT_LOCATION: [number, number] = [77.98, 32.175];

export const MAP_BUILDER_MIN_ZOOM = 0.8;

export const getMapBuilderMinZoom = (projectionName?: string) =>
  projectionName === "mercator" || projectionName === "globe"
    ? MAP_BUILDER_MIN_ZOOM
    : consts.MIN_ZOOM_3;
