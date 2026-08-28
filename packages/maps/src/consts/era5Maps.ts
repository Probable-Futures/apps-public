import { types } from "@probable-futures/lib";

export type Era5Map = {
  datasetId: number;
  slug: string;
  mapStyleId: string;
};

/**
 * ERA5 is reanalysis, so its warming levels stop where the observational record
 * does: the tiles carry `data_baseline_*` and `data_1c_*` and nothing above.
 * The higher levels are absent properties, not nulls, so a map asked for them
 * renders empty.
 */
export const ERA5_MAX_DEGREES = 1;

/**
 * Reserved `mapVersion` for the synthetic map that stands in for ERA5 on a
 * comparison side. Real versions start at 1, so 0 cannot collide with one.
 */
export const ERA5_MAP_VERSION = 0;

export const ERA5_VERSION_QUERY_VALUE = "era5";

/** A proper noun, so it is not translated — the same as the v3/v4 chips. */
export const ERA5_LABEL = "ERA5";

const era5Map = (datasetId: number, slug: string, mapStyleId: string): Era5Map => ({
  datasetId,
  slug,
  mapStyleId,
});

/**
 * One entry per dataset that has ERA5 tiles, ordered by dataset id so a given id
 * can be found by scanning. An empty style id means "published map pending" —
 * `getEra5MapForDataset` hides those, so an entry can be declared before the
 * style exists.
 *
 * There is deliberately no ramp here: ERA5 is an absolute climate map, so it
 * reuses the dataset's own `stops`/`binHexColors` rather than the diverging ramp
 * the difference maps carry.
 */
export const era5Maps: Era5Map[] = [
  era5Map(40101, "average_temperature", "cmtcrugjb001n01sg4p607m14"),
  era5Map(40102, "average_daytime_temperature", "cmtcryewv001l01s1b91ndn7k"),
  era5Map(40103, "10_hottest_days", "cmtcs3pw0001b01qu3xux7sqq"),
  era5Map(40104, "days_above_32c", "cmtcs7ezr001c01qu6d4ia0ea"),
  era5Map(40105, "days_above_35c", "cmtam709s00in01qzcm5o6mcn"),
  era5Map(40106, "days_above_38c", "cmtcsba3k001r01sggi5vc2ou"),
  era5Map(40107, "days_above_45c", "cmtcsgodl001e01qu0ri38mpw"),
  era5Map(40201, "average_nighttime_temperature", "cmtcsmg04001r01pcegincba6"),
  era5Map(40202, "frost_nights", "cmtcsrfpn001o01s13mxheptn"),
  era5Map(40203, "nights_above_20c", "cmtcsvatw001q01sahk565ejx"),
  era5Map(40204, "nights_above_25c", "cmtcsyuee001t01sg0637auog"),
  era5Map(40205, "freezing_days", "cmtct3e47000101s51vrjb7fw"),
  era5Map(40206, "10_hottest_nights", "cmtct7r0n001t01s198jqd1fj"),
  era5Map(40207, "average_winter_temperature", "cmtctdfjo001s01saax88c116"),
  era5Map(40301, "days_above_26c_wet-bulb", ""),
  era5Map(40302, "days_above_28c_wet-bulb", ""),
  era5Map(40303, "days_above_30c_wet-bulb", ""),
  era5Map(40304, "days_above_32c_wet-bulb", ""),
  era5Map(40305, "10_hottest_wet-bulb_days", ""),
  era5Map(40601, "change_in_total_annual_precipitation", "cmtctjbke002901qt5zln33ve"),
  era5Map(40607, "change_in_dry_hot_days", "cmtctn41q001v01sa7dcug3ta"),
  era5Map(40613, "change_in_precipitation_1-in-100_year_storm", "cmtctr5hu000401s51jb8f1ga"),
  era5Map(40614, "change_in_snowy_days", "cmtctursg001x01sg5dobg761"),
  era5Map(40616, "change_in_wettest_90_days", "cmtctzrrm001w01sa4o6j3km4"),
];

export const getEra5MapForDataset = (
  datasetId?: number,
  registry: Era5Map[] = era5Maps,
): Era5Map | undefined =>
  datasetId === undefined
    ? undefined
    : registry.find((era5) => era5.datasetId === datasetId && !!era5.mapStyleId);

/**
 * ERA5 has no database row, but every consumer of a comparison side — the swipe
 * view, the style link, the popups — is built around one. Copying the selected
 * row keeps the dataset's ramp, unit and labels intact (which is what an
 * absolute map wants) and swaps in only what ERA5 changes.
 */
export const buildEra5Map = (selectedDataset: types.Map, entry: Era5Map): types.Map => ({
  ...selectedDataset,
  mapStyleId: entry.mapStyleId,
  mapVersion: ERA5_MAP_VERSION,
  isLatest: false,
  status: undefined,
});

export const isEra5Map = (map?: types.Map): boolean => map?.mapVersion === ERA5_MAP_VERSION;
