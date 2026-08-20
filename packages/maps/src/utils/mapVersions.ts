import { types } from "@probable-futures/lib";

import { getDiffMapsForDataset, versionDiffMaps, VersionDiffMap } from "../consts/versionDiffMaps";

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
  const previous = [...versions]
    .reverse()
    .find(({ mapVersion }) => mapVersion < selected.mapVersion);
  if (previous) {
    return { before: previous, after: selected };
  }
  const next = versions.find(({ mapVersion }) => mapVersion > selected.mapVersion)!;
  return { before: selected, after: next };
};

export const getVersionLabel = (map: types.Map): string =>
  `v${map.mapVersion}${map.status && map.status !== "published" ? ` (${map.status})` : ""}`;

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
