import { describe, it, expect } from "vitest";
import { types } from "@probable-futures/lib";

import {
  areComparable,
  canRenderAbsolute,
  getMapValueMode,
  resolveChangeView,
} from "../mapValueMode";
import { buildEra5Map } from "../../consts/era5Maps";

const makeMap = ({
  datasetId = 40601,
  mapVersion,
  isDiff = true,
  name = "Change in total annual precipitation",
}: {
  datasetId?: number;
  mapVersion: number;
  isDiff?: boolean;
  name?: string;
}) =>
  ({
    mapStyleId: `style-v${mapVersion}`,
    name,
    slug: "change_in_total_annual_precipitation",
    mapVersion,
    isLatest: false,
    isDiff,
    methodUsedForMid: "mean",
    status: "published",
    stops: [1, 2, 3],
    binHexColors: ["#000"],
    step: 1,
    binningType: "number",
    dataLabels: [],
    dataset: { id: datasetId },
  } as unknown as types.Map);

const plain = (mapVersion: number) =>
  makeMap({ datasetId: 40104, mapVersion, isDiff: false, name: "Days above 32°C" });

describe("getMapValueMode", () => {
  it("reads a change row as change", () => {
    expect(getMapValueMode(makeMap({ mapVersion: 3 }))).toBe("change");
  });

  it("reads a normal map as absolute", () => {
    expect(getMapValueMode(plain(3))).toBe("absolute");
  });

  it("reads ERA5 as absolute even for a change dataset", () => {
    const era5 = buildEra5Map(makeMap({ mapVersion: 3 }), {
      datasetId: 40601,
      slug: "total_annual_precipitation",
      mapStyleId: "era5-style",
    });
    expect(getMapValueMode(era5)).toBe("absolute");
  });
});

describe("canRenderAbsolute", () => {
  it("is true for a change version with a published absolute rendering", () => {
    expect(canRenderAbsolute(makeMap({ mapVersion: 3 }))).toBe(true);
  });

  // 40607 has an absolute rendering for v3 but not for v4.
  it("is false for a change version without one", () => {
    expect(canRenderAbsolute(makeMap({ datasetId: 40607, mapVersion: 4 }))).toBe(false);
    expect(canRenderAbsolute(makeMap({ datasetId: 40607, mapVersion: 3 }))).toBe(true);
  });

  it("is true for anything already absolute", () => {
    expect(canRenderAbsolute(plain(3))).toBe(true);
  });
});

describe("areComparable", () => {
  it("allows two change versions of the same dataset", () => {
    expect(areComparable(makeMap({ mapVersion: 3 }), makeMap({ mapVersion: 4 }))).toBe(true);
  });

  it("allows ERA5 beside a change version that has an absolute rendering", () => {
    const era5 = buildEra5Map(makeMap({ mapVersion: 3 }), {
      datasetId: 40601,
      slug: "total_annual_precipitation",
      mapStyleId: "era5-style",
    });
    expect(areComparable(era5, makeMap({ mapVersion: 3 }))).toBe(true);
  });

  it("refuses ERA5 beside a change version with no absolute rendering", () => {
    const changeOnly = makeMap({ datasetId: 40607, mapVersion: 4 });
    const era5 = buildEra5Map(changeOnly, {
      datasetId: 40607,
      slug: "dry_hot_days",
      mapStyleId: "era5-style",
    });
    expect(areComparable(era5, changeOnly)).toBe(false);
  });

  it("refuses a change version beside a normal absolute map", () => {
    expect(areComparable(makeMap({ datasetId: 40607, mapVersion: 4 }), plain(3))).toBe(false);
  });

  it("allows any two versions of a normal map", () => {
    expect(areComparable(plain(3), plain(4))).toBe(true);
  });
});

describe("resolveChangeView", () => {
  const base = { showEra5: false, showAbsolute: false } as const;
  const era5 = buildEra5Map(makeMap({ mapVersion: 3 }), {
    datasetId: 40601,
    slug: "total_annual_precipitation",
    mapStyleId: "era5-style",
  });

  it("locks a single ERA5 map at absolute", () => {
    const view = resolveChangeView({
      ...base,
      comparisonMode: "none",
      selectedDataset: makeMap({ mapVersion: 3 }),
      showEra5: true,
    });
    expect(view).toMatchObject({ mode: "absolute", canChange: false, locked: true });
  });

  it("offers both on a single change map that has an absolute rendering", () => {
    const view = resolveChangeView({
      ...base,
      comparisonMode: "none",
      selectedDataset: makeMap({ mapVersion: 3 }),
    });
    expect(view).toMatchObject({ mode: "change", canChange: true, canAbsolute: true });
    expect(view.locked).toBe(false);
  });

  it("locks side by side at absolute when one side is ERA5", () => {
    const view = resolveChangeView({
      ...base,
      comparisonMode: "swipe",
      selectedDataset: makeMap({ mapVersion: 3 }),
      versionBefore: makeMap({ mapVersion: 3 }),
      versionAfter: era5,
    });
    expect(view).toMatchObject({ mode: "absolute", canChange: false, locked: true });
  });

  it("offers both for v3 vs v4 when each side has an absolute rendering", () => {
    const view = resolveChangeView({
      ...base,
      comparisonMode: "swipe",
      selectedDataset: makeMap({ mapVersion: 3 }),
      versionBefore: makeMap({ mapVersion: 3 }),
      versionAfter: makeMap({ mapVersion: 4 }),
    });
    expect(view).toMatchObject({ canChange: true, canAbsolute: true, locked: false });
  });

  // 40607 has an absolute rendering for v3 only, so the pair cannot both go absolute.
  it("offers change only when one side has no absolute rendering", () => {
    const view = resolveChangeView({
      ...base,
      comparisonMode: "swipe",
      selectedDataset: makeMap({ datasetId: 40607, mapVersion: 3 }),
      versionBefore: makeMap({ datasetId: 40607, mapVersion: 3 }),
      versionAfter: makeMap({ datasetId: 40607, mapVersion: 4 }),
    });
    expect(view).toMatchObject({ mode: "change", canAbsolute: false, locked: true });
  });

  it("keeps a comparison of normal maps on absolute", () => {
    const view = resolveChangeView({
      ...base,
      comparisonMode: "swipe",
      selectedDataset: plain(3),
      versionBefore: plain(3),
      versionAfter: plain(4),
    });
    expect(view).toMatchObject({ mode: "absolute", canChange: false, locked: true });
  });

  it("locks difference of a change map at change, since that is what built it", () => {
    const view = resolveChangeView({
      ...base,
      comparisonMode: "diff",
      selectedDataset: makeMap({ mapVersion: 3 }),
      showAbsolute: true,
    });
    expect(view).toMatchObject({ mode: "change", canAbsolute: false, locked: true });
  });

  it("locks difference of a normal map at absolute", () => {
    const view = resolveChangeView({
      ...base,
      comparisonMode: "diff",
      selectedDataset: plain(3),
    });
    expect(view).toMatchObject({ mode: "absolute", canChange: false, locked: true });
  });
});
