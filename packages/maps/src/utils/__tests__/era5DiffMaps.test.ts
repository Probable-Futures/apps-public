import { describe, it, expect } from "vitest";

import { era5V3DiffMaps } from "../../consts/era5DiffMaps";
import { era5Maps } from "../../consts/era5Maps";
import { DIFF_UNIT_FAMILIES } from "../../consts/versionDiffMaps";
import { ERA5_MAP_VERSION } from "../../consts/era5Maps";

// The styles are published one at a time, so most ids are still the empty
// "pending" placeholder and the shape is what there is to assert on.
describe("era5V3DiffMaps", () => {
  const era5DatasetIds = new Set(era5Maps.map(({ datasetId }) => datasetId));

  it("is the v3 − ERA5 direction for every entry", () => {
    era5V3DiffMaps.forEach((entry) => {
      expect(entry.baseVersion).toBe(ERA5_MAP_VERSION);
      expect(entry.targetVersion).toBe(3);
    });
  });

  it("never repeats a published style id across datasets", () => {
    const ids = era5V3DiffMaps.map(({ mapStyleId }) => mapStyleId).filter(Boolean);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carries the published days-above-35c style", () => {
    const entry = era5V3DiffMaps.find(({ datasetId }) => datasetId === 40105);

    expect(entry?.mapStyleId).toBe("cmtrqk1v8005g01qtb649e54u");
  });

  it("only covers datasets that actually have an ERA5 map", () => {
    era5V3DiffMaps.forEach((entry) => expect(era5DatasetIds.has(entry.datasetId)).toBe(true));
  });

  it("uses a known unit family's stop set for every entry", () => {
    const stopSets = Object.values(DIFF_UNIT_FAMILIES).map(({ stops }) => stops.join(","));

    era5V3DiffMaps.forEach(({ stops, unitLabel }) => {
      expect(unitLabel).toBeTruthy();
      expect(stopSets).toContain(stops.join(","));
    });
  });

  it("holds at most one entry per dataset", () => {
    const ids = era5V3DiffMaps.map(({ datasetId }) => datasetId);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
