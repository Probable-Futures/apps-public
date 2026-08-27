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
export const LATEST_MAP_VERSION = "latest";

export const MAP_STATUS_QUERY_PARAM = "status";
export const MAP_STATUS_FILTERS = ["all", "draft", "published", "archive"] as const;
export type MapStatusFilter = (typeof MAP_STATUS_FILTERS)[number];
export const DEFAULT_MAP_STATUS: MapStatusFilter = "published";

export const parseMapStatus = (value: string | null): MapStatusFilter | undefined =>
  MAP_STATUS_FILTERS.find((status) => status === value);

export const OLD_MAP_PROJECTION_QUERY_PARAM = "map_projection";
export const MAP_PROJECTION_QUERY_PARAM = "view";

export const mapBuilderProjections = [
  { label: "Mercator", value: "mercator" },
  { label: "Globe", value: "globe" },
  { label: "Albers", value: "albers" },
  { label: "Equal Earth", value: "equalEarth" },
  { label: "Equirectangular", value: "equirectangular" },
  { label: "Lambert Conformal Conic", value: "lambertConformalConic" },
  { label: "Natural Earth", value: "naturalEarth" },
  { label: "Winkel Tripel", value: "winkelTripel" },
];

export const mapBuilderProjectionNames = mapBuilderProjections.map(({ value }) => value);

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
