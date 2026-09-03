import { describe, it, expect } from "vitest";

import {
  absoluteMaps,
  absoluteRamps,
  getAbsoluteMap,
  getAbsoluteRamp,
} from "../../consts/absoluteMaps";

describe("getAbsoluteMap", () => {
  it("finds the style published for a dataset at a given version", () => {
    expect(getAbsoluteMap(40601, 3)?.mapStyleId).toBe("cmtinyy5n00br01qtexnz1blu");
    expect(getAbsoluteMap(40601, 4)?.mapStyleId).toBe("cmtiovs2g00bt01qtcqzkdgt6");
  });

  it("is version specific — a version without an absolute rendering has none", () => {
    expect(getAbsoluteMap(40601, 5)).toBeUndefined();
  });

  it("returns nothing for a dataset that has no absolute rendering", () => {
    expect(getAbsoluteMap(40104, 3)).toBeUndefined();
  });

  it("returns nothing when the dataset or version is unknown", () => {
    expect(getAbsoluteMap(undefined, 3)).toBeUndefined();
    expect(getAbsoluteMap(40601, undefined)).toBeUndefined();
  });

  it("ignores an entry declared before its style exists", () => {
    const registry = [{ datasetId: 40607, mapVersion: 3, mapStyleId: "" }];
    expect(getAbsoluteMap(40607, 3, registry)).toBeUndefined();
  });

  it("has no duplicate dataset/version pairs", () => {
    const keys = absoluteMaps.map(({ datasetId, mapVersion }) => `${datasetId}-${mapVersion}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("getAbsoluteRamp", () => {
  it("gives the precipitation sums their absolute bins", () => {
    expect(getAbsoluteRamp(40601)?.stops).toEqual([100, 250, 500, 1000, 1500, 2000]);
    expect(getAbsoluteRamp(40616)?.stops).toEqual([100, 250, 500, 1000, 1500, 2000]);
  });

  it("shares one ramp per dataset, so v3 and v4 stay on the same scale", () => {
    expect(getAbsoluteRamp(40601)).toBe(getAbsoluteRamp(40616));
  });

  it("returns nothing for a dataset whose bins have not been supplied", () => {
    expect(getAbsoluteRamp(40614)).toBeUndefined();
    expect(getAbsoluteRamp(undefined)).toBeUndefined();
  });

  it("pairs one more colour than stops, as the paint expression expects", () => {
    Object.values(absoluteRamps).forEach((ramp) => {
      if (ramp.binHexColors) {
        expect(ramp.binHexColors).toHaveLength(ramp.stops.length + 1);
      }
    });
  });

  it("keeps every ramp ascending", () => {
    Object.values(absoluteRamps).forEach(({ stops }) => {
      expect([...stops].sort((a, b) => a - b)).toEqual(stops);
    });
  });
});
