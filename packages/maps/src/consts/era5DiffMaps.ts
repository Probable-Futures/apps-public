import { diffMap, DiffUnitFamily, VersionDiffMap } from "./versionDiffMaps";
import { ERA5_MAP_VERSION } from "./era5Maps";

/**
 * The model-minus-observed differences: how far a dataset's model run sits from
 * what ERA5 actually observed. Red means the model is higher than ERA5.
 *
 * One registry per model version, each with one entry per dataset that has an
 * ERA5 map, ordered by dataset id to match `era5Maps` so the two registries can
 * be read side by side. An empty style id means "published map pending" — the
 * same convention as `versionDiffMaps` and `era5Maps` — so
 * `getDiffMapsForDataset` hides a row until a real id is pasted in.
 */
const era5Diff = (
  targetVersion: number,
  datasetId: number,
  slug: string,
  unitFamily: DiffUnitFamily,
  mapStyleId: string,
  unitLabel?: string,
): VersionDiffMap =>
  diffMap(datasetId, slug, unitFamily, mapStyleId, {
    baseVersion: ERA5_MAP_VERSION,
    targetVersion,
    unitLabel,
  });

const era5V3Diff = (
  datasetId: number,
  slug: string,
  unitFamily: DiffUnitFamily,
  mapStyleId: string,
  unitLabel?: string,
): VersionDiffMap => era5Diff(3, datasetId, slug, unitFamily, mapStyleId, unitLabel);

const era5V4Diff = (
  datasetId: number,
  slug: string,
  unitFamily: DiffUnitFamily,
  mapStyleId: string,
  unitLabel?: string,
): VersionDiffMap => era5Diff(4, datasetId, slug, unitFamily, mapStyleId, unitLabel);

export const era5V3DiffMaps: VersionDiffMap[] = [
  era5V3Diff(40101, "average_temperature", "temperature", "cmtrt0qxu006o01siay947f0b"),
  era5V3Diff(40102, "average_daytime_temperature", "temperature", "cmtrt73c800il01pm4lf9cvtz"),
  era5V3Diff(40103, "10_hottest_days", "temperature", "cmtrtcswi005j01qtcha6h7nb"),
  era5V3Diff(40104, "days_above_32c", "days", "cmtrtjuby00iy01r2dyiu42d3"),
  era5V3Diff(40105, "days_above_35c", "days", "cmtrqk1v8005g01qtb649e54u"),
  era5V3Diff(40106, "days_above_38c", "days", "cmtrtpq0f006q01sd1gyn8hjw"),
  era5V3Diff(40107, "days_above_45c", "days", "cmtrtw7ij005k01qtcgu8e7v5"),
  era5V3Diff(40201, "average_nighttime_temperature", "temperature", "cmtrv67xs006q01sigifk0wo9"),
  era5V3Diff(40202, "frost_nights", "days", "", "nights"),
  era5V3Diff(40203, "nights_above_20c", "days", "cmtrvc1gq006r01si70sp5a91", "nights"),
  era5V3Diff(40204, "nights_above_25c", "days", "cmtrvhs29006s01si4h4s78qy", "nights"),
  era5V3Diff(40205, "freezing_days", "days", "cmtrvnydn006t01si77l844oh"),
  era5V3Diff(40206, "10_hottest_nights", "temperature", "cmtrvtrck006u01si97qn0p11"),
  era5V3Diff(40207, "average_winter_temperature", "temperature", "cmtrvznz800hq01qy6u2y9mex"),
  era5V3Diff(40301, "days_above_26c_wet-bulb", "days", "cmts1k9rh00ir01pmci1xfxxd"),
  era5V3Diff(40302, "days_above_28c_wet-bulb", "days", "cmts1qdk800j301r24siz89pw"),
  era5V3Diff(40303, "days_above_30c_wet-bulb", "days", "cmts1w5n7006t01sdevab0lxi"),
  era5V3Diff(40304, "days_above_32c_wet-bulb", "days", "cmts21sxt00j401r2f6x36d61"),
  era5V3Diff(40305, "10_hottest_wet-bulb_days", "temperature", "cmts27thg006z01si7g8n0exl"),
  era5V3Diff(40601, "total_annual_precipitation", "millimeters", "cmts2je78007101sig5y22qnm"),
  era5V3Diff(40607, "dry_hot_days", "days", ""),
  era5V3Diff(
    40613,
    "precipitation_1-in-100_year_storm",
    "millimeters",
    "cmts2pocw00iu01pm7290cagr",
  ),
  era5V3Diff(40614, "snowy_days", "days", "cmts2xjco005r01qtcnpw6ext"),
  era5V3Diff(40616, "wettest_90_days", "millimeters", "cmts33l4i007201si5su9c4fb"),
];

export const era5V4DiffMaps: VersionDiffMap[] = [
  era5V4Diff(40101, "average_temperature", "temperature", "cmttwi52h003d01sggphvct2q"),
  era5V4Diff(40102, "average_daytime_temperature", "temperature", "cmttx7579003301s7adgod38v"),
  era5V4Diff(40103, "10_hottest_days", "temperature", "cmttyi328003c01sg653fc1ax"),
  era5V4Diff(40104, "days_above_32c", "days", "cmttz8dbv003c01s776ma2kxp"),
  era5V4Diff(40105, "days_above_35c", "days", "cmttzh6lk000401sihvdk6jqb"),
  era5V4Diff(40106, "days_above_38c", "days", "cmtu1vg1d004301qy9ahc4l39"),
  era5V4Diff(40107, "days_above_45c", "days", "cmtu248d6003r01sgcl2ra1kz"),
  era5V4Diff(40201, "average_nighttime_temperature", "temperature", "cmtu2as80003w01qt7aq43tqi"),
  era5V4Diff(40202, "frost_nights", "days", "", "nights"),
  era5V4Diff(40203, "nights_above_20c", "days", "cmtu33fp0003v01s79fyw6qmi", "nights"),
  era5V4Diff(40204, "nights_above_25c", "days", "cmtu3segx000b01r3ejm24uru", "nights"),
  era5V4Diff(40205, "freezing_days", "days", "cmtu4ih9b000g01r3h8ax387e"),
  era5V4Diff(40206, "10_hottest_nights", "temperature", "cmtu6ng2e004a01sg5l1n8375"),
  era5V4Diff(40207, "average_winter_temperature", "temperature", "cmtu6xgac004f01s747a9556l"),
  era5V4Diff(40301, "days_above_26c_wet-bulb", "days", "cmtu4olwn000j01r3f0t5d81h"),
  era5V4Diff(40302, "days_above_28c_wet-bulb", "days", "cmtu4uayn004501qtfih867zs"),
  era5V4Diff(40303, "days_above_30c_wet-bulb", "days", "cmtu5jlsn004801qtdrj8g317"),
  era5V4Diff(40304, "days_above_32c_wet-bulb", "days", "cmtu69ehh004601sg7zfw4jd3"),
  era5V4Diff(40305, "10_hottest_wet-bulb_days", "temperature", "cmtu6gjm7004e01qt9d6y48ln"),
  era5V4Diff(40601, "total_annual_precipitation", "millimeters", "cmtu7njj4004k01sgh7129ji6"),
  era5V4Diff(40607, "dry_hot_days", "days", ""),
  era5V4Diff(
    40613,
    "precipitation_1-in-100_year_storm",
    "millimeters",
    "cmtu8eaje004u01sga5qt1hqu",
  ),
  era5V4Diff(40614, "snowy_days", "days", "cmtu93bzf004y01sgeud660p9"),
  era5V4Diff(40616, "wettest_90_days", "millimeters", "cmtu9a9w7004r01sg0jn6a062"),
];
