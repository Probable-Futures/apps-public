import { describe, it, expect } from "vitest";

import { era5V3DiffMaps, era5V4DiffMaps } from "../../consts/era5DiffMaps";
import { era5Maps, ERA5_MAP_VERSION } from "../../consts/era5Maps";
import { DIFF_UNIT_FAMILIES, versionDiffMaps } from "../../consts/versionDiffMaps";

const era5DatasetIds = new Set(era5Maps.map(({ datasetId }) => datasetId));

// The styles are published one at a time, so some ids are still the empty
// "pending" placeholder and the shape is what there is to assert on.
describe.each([
  ["era5V3DiffMaps", era5V3DiffMaps, 3],
  ["era5V4DiffMaps", era5V4DiffMaps, 4],
])("%s", (_name, registry, targetVersion) => {
  it("is the model-minus-ERA5 direction for every entry", () => {
    registry.forEach((entry) => {
      expect(entry.baseVersion).toBe(ERA5_MAP_VERSION);
      expect(entry.targetVersion).toBe(targetVersion);
    });
  });

  it("only covers datasets that actually have an ERA5 map", () => {
    registry.forEach((entry) => expect(era5DatasetIds.has(entry.datasetId)).toBe(true));
  });

  it("uses a known unit family's stop set for every entry", () => {
    const stopSets = Object.values(DIFF_UNIT_FAMILIES).map(({ stops }) => stops.join(","));

    registry.forEach(({ stops, unitLabel }) => {
      expect(unitLabel).toBeTruthy();
      expect(stopSets).toContain(stops.join(","));
    });
  });

  it("holds at most one entry per dataset", () => {
    const ids = registry.map(({ datasetId }) => datasetId);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the ERA5 difference registries together", () => {
  it("cover the same datasets in the same order, so they read side by side", () => {
    expect(era5V4DiffMaps.map(({ datasetId }) => datasetId)).toEqual(
      era5V3DiffMaps.map(({ datasetId }) => datasetId),
    );
  });

  it("agree on each dataset's unit family, since only the model version differs", () => {
    era5V3DiffMaps.forEach((v3Entry, index) => {
      const v4Entry = era5V4DiffMaps[index];
      expect(v4Entry.unitFamily).toBe(v3Entry.unitFamily);
      expect(v4Entry.unitLabel).toBe(v3Entry.unitLabel);
    });
  });

  it("never reuse a published style id, here or in the version-to-version registry", () => {
    const ids = [...versionDiffMaps, ...era5V3DiffMaps, ...era5V4DiffMaps]
      .map(({ mapStyleId }) => mapStyleId)
      .filter(Boolean);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carry the published days-above-35c styles", () => {
    const v3 = era5V3DiffMaps.find(({ datasetId }) => datasetId === 40105);
    const v4 = era5V4DiffMaps.find(({ datasetId }) => datasetId === 40105);

    expect(v3?.mapStyleId).toBe("cmtrqk1v8005g01qtb649e54u");
    expect(v4?.mapStyleId).toBe("cmttzh6lk000401sihvdk6jqb");
  });
});
