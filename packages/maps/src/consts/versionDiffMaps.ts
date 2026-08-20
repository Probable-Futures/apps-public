export type VersionDiffMap = {
  datasetId: number;
  slug: string;
  baseVersion: number;
  targetVersion: number;
  mapStyleId: string;
  stops: number[];
  binHexColors?: string[];
  unitLabel: string;
};

export const DEFAULT_DIFF_BIN_HEX_COLORS = [
  "#08519c",
  "#4292c6",
  "#9ecae1",
  "#b9bfc7",
  "#fcae91",
  "#ef3b2c",
  "#a50f15",
];

/** The greys `getFillColorExpresion` reserves for absent data, per constraint 3. */
export const NO_DATA_HEX_COLORS = ["#f5f5f5", "#e6e6e6"];

export type DiffUnitFamily = "temperature" | "days" | "millimeters" | "percent" | "zScore";

export const DIFF_UNIT_FAMILIES: Record<DiffUnitFamily, { stops: number[]; unitLabel: string }> = {
  temperature: { stops: [-2, -1, -0.3, 0.3, 1, 2], unitLabel: "°C" },
  days: { stops: [-20, -8, -2, 2, 8, 20], unitLabel: "days" },
  millimeters: { stops: [-100, -40, -10, 10, 40, 100], unitLabel: "mm" },
  percent: { stops: [-20, -8, -2, 2, 8, 20], unitLabel: "% points" },
  zScore: { stops: [-1, -0.5, -0.15, 0.15, 0.5, 1], unitLabel: "SPEI" },
};

type DiffMapOptions = {
  baseVersion?: number;
  targetVersion?: number;
  unitLabel?: string;
};

const diffMap = (
  datasetId: number,
  slug: string,
  unitFamily: DiffUnitFamily,
  mapStyleId: string,
  { baseVersion = 3, targetVersion = 4, unitLabel }: DiffMapOptions = {},
): VersionDiffMap => ({
  datasetId,
  slug,
  baseVersion,
  targetVersion,
  mapStyleId,
  stops: DIFF_UNIT_FAMILIES[unitFamily].stops,
  unitLabel: unitLabel ?? DIFF_UNIT_FAMILIES[unitFamily].unitLabel,
});

/**
 * One entry per dataset that carries a difference map, ordered by dataset id so
 * a given id can be found by scanning. An empty style id means "published map
 * pending" — see the field's note on `VersionDiffMap`.
 */
export const versionDiffMaps: VersionDiffMap[] = [
  diffMap(40101, "average_temperature", "temperature", "cmszwsyju00a301qy7ut1a713"),
  diffMap(40102, "average-daytime-temperature", "temperature", "cmt02f1f000ew01seczxx74zo"),
  diffMap(40103, "ten-hottest-days", "temperature", "cmt02nc1o00ex01se3pnjephc"),
  diffMap(40104, "days_above_32c", "days", "cmszx1mop00e601se16l16u0x"),
  diffMap(40105, "days_above_35c", "days", "cmsxpxig0006j01qya4zo4eyx"),
  diffMap(40106, "days-above-38c", "days", "cmt02wt2i00cn01sd2inu3c8d"),
  diffMap(40107, "days-above-45c", "days", "cmt0367vu003201qxayfw2h09"),
  diffMap(40201, "average-nighttime-temperature", "temperature", "cmt04k6wt000101sgejh5d5q3"),
  diffMap(40202, "frost_nights", "days", "", { unitLabel: "nights" }),
  diffMap(40203, "nights-above-20c", "days", "cmt04ti30000101shhved57po", {
    unitLabel: "nights",
  }),
  diffMap(40204, "nights-above-25c", "days", "cmt053f73000301scc0ei0vg2", {
    unitLabel: "nights",
  }),
  diffMap(40205, "freezing-days", "days", "cmt05cw1k000501sc5oi14hr3"),
  diffMap(40206, "10_hottest_nights", "temperature", "cmszx92pa00e801seg2w880qd"),
  diffMap(40207, "average-winter-temperature", "temperature", "cmt05nvw8000601sccu5hfzxo"),
  diffMap(40301, "days_above_26c_wet-bulb", "days", "cmszxjf6o00c301sd5g7p5oe8"),
  diffMap(40302, "days_above_28c_wet-bulb", "days", "cmszxw8lq00af01sa1chs7ogl"),
  diffMap(40303, "days-above-30c-wbmax", "days", "cmt05whxc000501qz3uuvd395"),
  diffMap(40304, "days-above-32c-wbmax", "days", "cmt0684aw000a01scaoedg1s7"),
  diffMap(
    40601,
    "change_in_total_annual_precipitation",
    "millimeters",
    "cmszy8x6w00ed01se66tnf7gk",
  ),
  diffMap(40613, "change_in_precipitation_1-in-100_year_storm", "millimeters", ""),
  diffMap(40614, "change_in_snowy_days", "days", "cmszyls2c00c901sdfiaa23ux"),
  diffMap(40616, "change_in_wettest_90_days", "millimeters", ""),
  diffMap(40701, "likelihood_of_year-plus_extreme_drought", "percent", "cmt06ia7j000f01sg5dlafrsa"),
  diffMap(40702, "probability-of-drought", "percent", "cmszywa1300aj01sa7y2v8s50"),
  diffMap(40703, "change_in_water_balance", "zScore", ""),
];

export const getDiffMapsForDataset = (
  datasetId?: number,
  registry: VersionDiffMap[] = versionDiffMaps,
): VersionDiffMap[] =>
  datasetId === undefined
    ? []
    : registry.filter((diffMap) => diffMap.datasetId === datasetId && !!diffMap.mapStyleId);

export const getDiffMapForPair = (
  datasetId?: number,
  baseVersion?: number,
  targetVersion?: number,
  registry: VersionDiffMap[] = versionDiffMaps,
): VersionDiffMap | undefined =>
  getDiffMapsForDataset(datasetId, registry).find(
    (diffMap) => diffMap.baseVersion === baseVersion && diffMap.targetVersion === targetVersion,
  );

export const getDiffMapBinHexColors = (diffMap: VersionDiffMap): string[] =>
  diffMap.binHexColors ?? DEFAULT_DIFF_BIN_HEX_COLORS;

export const getDiffPairLabel = ({ baseVersion, targetVersion }: VersionDiffMap): string =>
  `v${targetVersion} − v${baseVersion}`;
