import { types } from "@probable-futures/lib";

import { DEFAULT_MAP_STATUS, LATEST_MAP_VERSION, MapStatusFilter } from "../consts/mapConsts";

export type MapSelectionParams = {
  slug?: string;
  version?: string;
  status?: string;
};

/**
 * A change map shows a difference from the 0.5°C baseline rather than an absolute
 * value, so the baseline is not one of its warming scenarios. The v5 maps dropped
 * the "Change in" prefix from their names, which is why the flag is checked too.
 */
export const isChangeMap = (map?: types.Map): boolean =>
  !!(map?.isDiff || map?.name.toLowerCase().startsWith("change"));

const STATUS_PREFERENCE: MapStatusFilter[] = ["published", "draft", "archive"];

const statusPreference = (status?: string): MapStatusFilter[] => {
  const preferred = STATUS_PREFERENCE.find((value) => value === status);
  return preferred
    ? [preferred, ...STATUS_PREFERENCE.filter((value) => value !== preferred)]
    : STATUS_PREFERENCE;
};

const statusRank = (preference: MapStatusFilter[], { status }: types.Map) => {
  const index = preference.findIndex((value) => value === (status || DEFAULT_MAP_STATUS));
  return index === -1 ? preference.length : index;
};

const comparePool = (preference: MapStatusFilter[]) => (a: types.Map, b: types.Map) =>
  statusRank(preference, a) - statusRank(preference, b) ||
  Number(b.isLatest) - Number(a.isLatest) ||
  b.mapVersion - a.mapVersion ||
  b.dataset.id - a.dataset.id;

export const findMapForSlug = (
  maps: types.Map[],
  { slug, version, status }: MapSelectionParams,
): types.Map | undefined => {
  if (!slug) {
    return undefined;
  }
  const candidates = maps.filter((map) => map.slug === slug);
  if (candidates.length === 0) {
    return undefined;
  }
  const requestedVersion =
    version && version !== LATEST_MAP_VERSION
      ? candidates.filter(({ mapVersion }) => mapVersion.toString() === version)
      : [];
  const pool = requestedVersion.length > 0 ? requestedVersion : candidates;
  return [...pool].sort(comparePool(statusPreference(status)))[0];
};

export const findMapForParams = (
  maps: types.Map[],
  params: MapSelectionParams,
): types.Map | undefined =>
  maps.find(({ mapStyleId }) => !!params.slug && mapStyleId === params.slug) ??
  findMapForSlug(maps, params);

export const isLatestMapForSlug = (maps: types.Map[], map: types.Map, status?: string): boolean =>
  findMapForSlug(maps, { slug: map.slug, status }) === map;

export const findDefaultMap = (maps: types.Map[], status?: string): types.Map | undefined => {
  const preference = statusPreference(status);
  return [...maps].sort(
    (a, b) =>
      statusRank(preference, a) - statusRank(preference, b) ||
      a.dataset.id - b.dataset.id ||
      Number(b.isLatest) - Number(a.isLatest) ||
      b.mapVersion - a.mapVersion,
  )[0];
};
