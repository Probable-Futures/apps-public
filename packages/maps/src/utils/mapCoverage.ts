import { types } from "@probable-futures/lib";

import { absoluteMaps } from "../consts/absoluteMaps";
import { getEra5MapForDataset } from "../consts/era5Maps";

export const FIRST_CURRENT_DATASET_ID = 40000;

export type MapCoverageRow = {
  datasetId: number;
  /** A representative row, for naming the dataset. */
  slug: string;
  name: string;
  /** Every published version, ascending. */
  versions: number[];
  hasEra5: boolean;
  /** Versions with a published absolute rendering, ascending. */
  absoluteVersions: number[];
};

/**
 * One row per dataset, saying which versions and hand-registered renderings exist.
 *
 * Deliberately built from the full dataset list rather than the filtered one: this
 * is a statement about what has been published, so it should not shift when the
 * status or category filters change. Legacy datasets are the one exception — see
 * `FIRST_CURRENT_DATASET_ID`.
 */
export const getMapCoverage = (datasets: types.Map[]): MapCoverageRow[] => {
  const byDataset = new Map<number, types.Map[]>();
  datasets
    .filter(({ dataset }) => dataset.id >= FIRST_CURRENT_DATASET_ID)
    .forEach((map) => {
      const rows = byDataset.get(map.dataset.id);
      if (rows) {
        rows.push(map);
      } else {
        byDataset.set(map.dataset.id, [map]);
      }
    });

  return [...byDataset.entries()]
    .map(([datasetId, rows]) => {
      // The latest row names the dataset: older versions can carry a stale name.
      const named = rows.find(({ isLatest }) => isLatest) ?? rows[0];
      return {
        datasetId,
        slug: named.slug,
        name: named.name,
        versions: [...new Set(rows.map(({ mapVersion }) => mapVersion))].sort((a, b) => a - b),
        hasEra5: !!getEra5MapForDataset(datasetId),
        absoluteVersions: absoluteMaps
          .filter((entry) => entry.datasetId === datasetId)
          .map(({ mapVersion }) => mapVersion)
          .sort((a, b) => a - b),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};
