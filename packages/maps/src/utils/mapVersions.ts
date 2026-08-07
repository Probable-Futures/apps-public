import { types } from "@probable-futures/lib";

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
