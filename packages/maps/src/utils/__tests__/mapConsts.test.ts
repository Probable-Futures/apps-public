import { describe, it, expect } from "vitest";

import { parseComparisonMode, serializeComparisonMode } from "../../consts/mapConsts";

describe("parseComparisonMode", () => {
  it("restores the plain modes", () => {
    expect(parseComparisonMode("swipe")).toBe("swipe");
  });

  it("restores the v4 − v3 difference mode from its unchanged query value", () => {
    expect(parseComparisonMode("diff")).toBe("diff");
  });

  it("restores the v3 − ERA5 difference mode from its own query value", () => {
    expect(parseComparisonMode("diff_era5_v3")).toBe("diffEra5V3");
  });

  it("returns undefined for an unknown or absent value", () => {
    expect(parseComparisonMode("bogus")).toBeUndefined();
    expect(parseComparisonMode(null)).toBeUndefined();
  });
});

describe("serializeComparisonMode", () => {
  it("round-trips every mode through parseComparisonMode", () => {
    (["swipe", "diff", "diffEra5V3"] as const).forEach((mode) => {
      expect(parseComparisonMode(serializeComparisonMode(mode))).toBe(mode);
    });
  });

  it("keeps the v4 − v3 mode's query value unchanged, so old shared links still work", () => {
    expect(serializeComparisonMode("diff")).toBe("diff");
  });

  it("writes the v3 − ERA5 mode under its own query value, never as the camelCase mode name", () => {
    expect(serializeComparisonMode("diffEra5V3")).toBe("diff_era5_v3");
  });

  it("passes a non-diff mode through unchanged", () => {
    expect(serializeComparisonMode("none")).toBe("none");
    expect(serializeComparisonMode("swipe")).toBe("swipe");
  });
});
