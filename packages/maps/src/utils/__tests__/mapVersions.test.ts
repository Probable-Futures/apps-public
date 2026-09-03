import { describe, it, expect } from "vitest";
import { types } from "@probable-futures/lib";

import {
  getComparisonSideLabel,
  getDefaultSwipePair,
  getDefaultVersionPair,
  getVersionLabel,
  getVersionSourceLabel,
  getVersionsOfDataset,
} from "../mapVersions";
import { buildEra5Map } from "../../consts/era5Maps";

type MapOverrides = {
  datasetId?: number;
  mapVersion: number;
  methodUsedForMid?: string;
  status?: string;
  mapStyleId?: string;
};

const makeMap = ({
  datasetId = 40104,
  mapVersion,
  methodUsedForMid = "mean",
  status = "published",
  mapStyleId,
}: MapOverrides) =>
  ({
    mapStyleId: mapStyleId ?? `style-${datasetId}-v${mapVersion}-${methodUsedForMid}`,
    name: "Days above 32°C",
    slug: "days-above-32c",
    mapVersion,
    isLatest: false,
    methodUsedForMid,
    status,
    stops: [1, 8, 31],
    binHexColors: ["#000", "#111", "#222"],
    isDiff: false,
    step: 1,
    binningType: "number",
    dataLabels: [],
    dataset: { id: datasetId },
  } as unknown as types.Map);

describe("getVersionsOfDataset", () => {
  it("returns nothing when no dataset is selected", () => {
    expect(getVersionsOfDataset([makeMap({ mapVersion: 3 })], undefined)).toEqual([]);
  });

  it("keeps only maps belonging to the selected dataset", () => {
    const v3 = makeMap({ mapVersion: 3 });
    const otherDataset = makeMap({ datasetId: 99999, mapVersion: 7 });

    const result = getVersionsOfDataset([v3, otherDataset], v3);

    expect(result).toEqual([v3]);
  });

  it("returns one entry per version, sorted ascending", () => {
    const v5 = makeMap({ mapVersion: 5 });
    const v3 = makeMap({ mapVersion: 3 });
    const v4 = makeMap({ mapVersion: 4 });

    const result = getVersionsOfDataset([v5, v3, v4], v5);

    expect(result.map(({ mapVersion }) => mapVersion)).toEqual([3, 4, 5]);
  });

  it("prefers the entry matching the selected dataset's mid-value method", () => {
    const v3Mean = makeMap({ mapVersion: 3, methodUsedForMid: "mean" });
    const v3Median = makeMap({ mapVersion: 3, methodUsedForMid: "median" });
    const v5Median = makeMap({ mapVersion: 5, methodUsedForMid: "median" });

    const result = getVersionsOfDataset([v3Mean, v3Median, v5Median], v5Median);

    expect(result).toEqual([v3Median, v5Median]);
  });

  it("falls back to any entry for a version that lacks the selected mid-value method", () => {
    const v3Mean = makeMap({ mapVersion: 3, methodUsedForMid: "mean" });
    const v5Median = makeMap({ mapVersion: 5, methodUsedForMid: "median" });

    const result = getVersionsOfDataset([v3Mean, v5Median], v5Median);

    expect(result).toEqual([v3Mean, v5Median]);
  });

  it("includes archived and draft versions so there is something to compare against", () => {
    const v3 = makeMap({ mapVersion: 3, status: "archive" });
    const v4 = makeMap({ mapVersion: 4, status: "draft" });
    const v5 = makeMap({ mapVersion: 5, status: "published" });

    const result = getVersionsOfDataset([v3, v4, v5], v5);

    expect(result).toEqual([v3, v4, v5]);
  });
});

describe("getDefaultVersionPair", () => {
  it("returns undefined when there is only one version", () => {
    const v5 = makeMap({ mapVersion: 5 });
    expect(getDefaultVersionPair([v5], v5)).toBeUndefined();
  });

  it("returns undefined when no dataset is selected", () => {
    const versions = [makeMap({ mapVersion: 3 }), makeMap({ mapVersion: 5 })];
    expect(getDefaultVersionPair(versions, undefined)).toBeUndefined();
  });

  it("pairs the previous version on the left with the selected version on the right", () => {
    const v3 = makeMap({ mapVersion: 3 });
    const v4 = makeMap({ mapVersion: 4 });
    const v5 = makeMap({ mapVersion: 5 });

    expect(getDefaultVersionPair([v3, v4, v5], v5)).toEqual({ before: v4, after: v5 });
    expect(getDefaultVersionPair([v3, v4, v5], v4)).toEqual({ before: v3, after: v4 });
  });

  it("keeps the older version on the left when the oldest version is selected", () => {
    const v3 = makeMap({ mapVersion: 3 });
    const v4 = makeMap({ mapVersion: 4 });
    const v5 = makeMap({ mapVersion: 5 });

    expect(getDefaultVersionPair([v3, v4, v5], v3)).toEqual({ before: v3, after: v4 });
  });

  it("always orders the pair chronologically", () => {
    const versions = [3, 4, 5].map((mapVersion) => makeMap({ mapVersion }));

    versions.forEach((selected) => {
      const pair = getDefaultVersionPair(versions, selected)!;
      expect(pair.before.mapVersion).toBeLessThan(pair.after.mapVersion);
    });
  });

  it("falls back to the newest version when the selected version is not in the list", () => {
    const v3 = makeMap({ mapVersion: 3 });
    const v5 = makeMap({ mapVersion: 5 });
    const v9 = makeMap({ mapVersion: 9 });

    expect(getDefaultVersionPair([v3, v5], v9)).toEqual({ before: v3, after: v5 });
  });

  it("never pairs a version with itself", () => {
    const versions = [makeMap({ mapVersion: 3 }), makeMap({ mapVersion: 5 })];
    const pair = getDefaultVersionPair(versions, versions[1])!;

    expect(pair.before.mapVersion).not.toBe(pair.after.mapVersion);
  });
});

describe("getVersionLabel", () => {
  it("labels a published version with just the version number", () => {
    expect(getVersionLabel(makeMap({ mapVersion: 5 }))).toBe("v5");
  });

  it("calls out a non-published status", () => {
    expect(getVersionLabel(makeMap({ mapVersion: 3, status: "archive" }))).toBe("v3 (archive)");
    expect(getVersionLabel(makeMap({ mapVersion: 4, status: "draft" }))).toBe("v4 (draft)");
  });
});

const era5MapFor = (map: types.Map) =>
  buildEra5Map(map, { datasetId: 40104, slug: "days-above-32c", mapStyleId: "era5-style" });

describe("getVersionSourceLabel", () => {
  it("names a version, whether it is latest, and what produced it", () => {
    const map = { ...makeMap({ mapVersion: 3 }), isLatest: true };
    expect(getVersionSourceLabel(map)).toBe("v3 · latest · CORDEX");
  });

  it("leaves out the latest marker for a superseded version", () => {
    expect(getVersionSourceLabel(makeMap({ mapVersion: 2 }))).toBe("v2 · CORDEX");
  });

  it("keeps a non-published status alongside the descriptor", () => {
    expect(getVersionSourceLabel(makeMap({ mapVersion: 4, status: "draft" }))).toBe(
      "v4 (draft) · stat. downscaled",
    );
  });

  it("names a version with no registry entry by its number alone", () => {
    expect(getVersionSourceLabel(makeMap({ mapVersion: 9 }))).toBe("v9");
  });

  it("names an ERA5 side by what it is, never by its reserved version number", () => {
    const era5 = buildEra5Map(makeMap({ mapVersion: 4 }), {
      datasetId: 40104,
      slug: "days-above-32c",
      mapStyleId: "era5-style",
    });
    expect(getVersionSourceLabel(era5)).toBe("ERA5");
  });
});

describe("getComparisonSideLabel", () => {
  it("names an ERA5 side by what it is, never by its reserved version number", () => {
    const label = getComparisonSideLabel(era5MapFor(makeMap({ mapVersion: 4 })));

    expect(label).toBe("ERA5");
    expect(label).not.toContain("0");
  });

  it("labels a real side exactly as the version picker does", () => {
    expect(getComparisonSideLabel(makeMap({ mapVersion: 3 }))).toBe("v3");
    expect(getComparisonSideLabel(makeMap({ mapVersion: 4, status: "draft" }))).toBe("v4 (draft)");
  });
});

describe("getDefaultSwipePair", () => {
  it("pairs two versions among themselves and leaves ERA5 out of it", () => {
    const versions = [makeMap({ mapVersion: 3 }), makeMap({ mapVersion: 4 })];
    const pair = getDefaultSwipePair(versions, versions[1], era5MapFor(versions[1]))!;

    expect(pair.before.mapVersion).toBe(3);
    expect(pair.after.mapVersion).toBe(4);
  });

  // 40607 has ERA5 but no v4, so without this it would never be comparable.
  it("pairs a lone version against ERA5, which is the only thing left to compare with", () => {
    const versions = [makeMap({ mapVersion: 3 })];
    const era5 = era5MapFor(versions[0]);
    const pair = getDefaultSwipePair(versions, versions[0], era5)!;

    expect(pair.before).toBe(versions[0]);
    expect(pair.after).toBe(era5);
  });

  it("returns the same ERA5 object it was handed, so the caller's memo settles", () => {
    const versions = [makeMap({ mapVersion: 3 })];
    const era5 = era5MapFor(versions[0]);

    expect(getDefaultSwipePair(versions, versions[0], era5)?.after).toBe(
      getDefaultSwipePair(versions, versions[0], era5)?.after,
    );
  });

  it("gives up when a lone version has no ERA5 to pair with", () => {
    const versions = [makeMap({ mapVersion: 3 })];

    expect(getDefaultSwipePair(versions, versions[0], undefined)).toBeUndefined();
  });

  it("gives up when there is nothing to pair at all", () => {
    expect(getDefaultSwipePair([], undefined, undefined)).toBeUndefined();
  });
});
