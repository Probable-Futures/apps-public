import { types } from "@probable-futures/lib";

import { getDiffMapsForDataset, versionDiffMaps, VersionDiffMap } from "../consts/versionDiffMaps";
import { ERA5_LABEL, isEra5Map } from "../consts/era5Maps";
import { getVersionDescriptor } from "../consts/versionDescriptors";
import { areComparable, canRenderAbsolute } from "./mapValueMode";

/**
 * One entry per map version, ascending. A dataset has a row per version *per*
 * mid-value method, so the row matching `selectedDataset.methodUsedForMid` wins.
 * Status is not filtered — superseded versions are usually archived, and
 * excluding them would leave nothing to compare against.
 */
export const getVersionsOfDataset = (
  datasets: types.Map[],
  selectedDataset?: types.Map,
): types.Map[] => {
  if (!selectedDataset) {
    return [];
  }
  const byVersion = new Map<number, types.Map>();
  datasets
    .filter(({ dataset }) => dataset.id === selectedDataset.dataset.id)
    .forEach((map) => {
      if (
        !byVersion.has(map.mapVersion) ||
        map.methodUsedForMid === selectedDataset.methodUsedForMid
      ) {
        byVersion.set(map.mapVersion, map);
      }
    });
  return [...byVersion.values()].sort((a, b) => a.mapVersion - b.mapVersion);
};

/**
 * Pairs the selected version with a neighbour, older side always on the left so
 * the divider labels read chronologically. Expects `versions` ascending.
 */
export const getDefaultVersionPair = (
  versions: types.Map[],
  selectedDataset?: types.Map,
): { before: types.Map; after: types.Map } | undefined => {
  if (versions.length < 2 || !selectedDataset) {
    return undefined;
  }
  const selected =
    versions.find(({ mapVersion }) => mapVersion === selectedDataset.mapVersion) ??
    versions[versions.length - 1];
  // Only a side rendering the same kind of value can be paired with it: a change
  // version against the absolute row would be comparing differences to totals.
  const candidates = versions.filter(
    (map) => map.mapVersion !== selected.mapVersion && areComparable(map, selected),
  );
  const previous = [...candidates]
    .reverse()
    .find(({ mapVersion }) => mapVersion < selected.mapVersion);
  if (previous) {
    return { before: previous, after: selected };
  }
  const next = candidates.find(({ mapVersion }) => mapVersion > selected.mapVersion);
  return next ? { before: selected, after: next } : undefined;
};

export const getVersionLabel = (map: types.Map): string =>
  `v${map.mapVersion}${map.status && map.status !== "published" ? ` (${map.status})` : ""}`;

export const getVersionSourceLabel = (map: types.Map): string => {
  if (isEra5Map(map)) {
    return ERA5_LABEL;
  }
  return [
    getVersionLabel(map),
    map.isLatest ? "latest" : undefined,
    getVersionDescriptor(map.mapVersion),
  ]
    .filter(Boolean)
    .join(" · ");
};

/**
 * The reserved ERA5 version number must never reach a label, so every place that
 * names a comparison side goes through here rather than reading `mapVersion`.
 */
export const getComparisonSideLabel = (map: types.Map): string =>
  isEra5Map(map) ? ERA5_LABEL : getVersionLabel(map);

export const getComparisonSideShortLabel = (map: types.Map): string =>
  isEra5Map(map) ? ERA5_LABEL : `v${map.mapVersion}`;

/**
 * The pair the side-by-side view opens on. Falls back to pairing the newest
 * version against ERA5 when the dataset has too few versions to pair among
 * themselves — 40607 has ERA5 but no v4, and would otherwise never be
 * comparable at all. Takes the ERA5 side already built so the caller can keep a
 * stable object across renders, which is what lets the reconcile effect settle.
 */
export const getDefaultSwipePair = (
  versions: types.Map[],
  selectedDataset?: types.Map,
  era5Map?: types.Map,
): { before: types.Map; after: types.Map } | undefined => {
  const versionPair = getDefaultVersionPair(versions, selectedDataset);
  if (versionPair) {
    return versionPair;
  }
  // ERA5 is absolute, so it can only open against a side that renders absolute too.
  const newest = [...versions].reverse().find((map) => canRenderAbsolute(map));
  return newest && era5Map ? { before: newest, after: era5Map } : undefined;
};

export const getAvailableDiffPairs = (
  versions: types.Map[],
  datasetId?: number,
  registry: VersionDiffMap[] = versionDiffMaps,
): { diffMap: VersionDiffMap; before: types.Map; after: types.Map }[] =>
  getDiffMapsForDataset(datasetId, registry)
    .map((diffMap) => {
      const before = versions.find(({ mapVersion }) => mapVersion === diffMap.baseVersion);
      const after = versions.find(({ mapVersion }) => mapVersion === diffMap.targetVersion);
      return before && after ? { diffMap, before, after } : undefined;
    })
    .filter((pair): pair is { diffMap: VersionDiffMap; before: types.Map; after: types.Map } =>
      Boolean(pair),
    )
    .sort((a, b) => a.diffMap.targetVersion - b.diffMap.targetVersion);

export const getDefaultDiffPair = (
  versions: types.Map[],
  datasetId?: number,
  before?: types.Map,
  after?: types.Map,
  registry: VersionDiffMap[] = versionDiffMaps,
) => {
  const pairs = getAvailableDiffPairs(versions, datasetId, registry);
  const current = pairs.find(
    ({ diffMap }) =>
      diffMap.baseVersion === before?.mapVersion && diffMap.targetVersion === after?.mapVersion,
  );
  return current ?? pairs[pairs.length - 1];
};
