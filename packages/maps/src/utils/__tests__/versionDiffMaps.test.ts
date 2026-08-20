import { describe, it, expect } from "vitest";
import { consts, types } from "@probable-futures/lib";

import {
  DEFAULT_DIFF_BIN_HEX_COLORS,
  Z_SCORE_DECIMALS,
  formatDiffValue,
  DIFF_UNIT_FAMILIES,
  NO_DATA_HEX_COLORS,
  VersionDiffMap,
  getDiffMapBinHexColors,
  getDiffMapForPair,
  getDiffMapsForDataset,
  getDiffPairLabel,
  versionDiffMaps,
} from "../../consts/versionDiffMaps";
import { getAvailableDiffPairs, getDefaultDiffPair } from "../mapVersions";
import { formatDelta } from "../../components/Maps/DiffMapKey";

const DATASET_ID = 40104;

const toRgb = (hex: string) =>
  [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));

/** Rec. 709 weights — enough to rank the ramp, no colour-space rigour needed. */
const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const distance = (a: string, b: string) => {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  return Math.hypot(ar - br, ag - bg, ab - bb);
};

const makeMap = (mapVersion: number, datasetId = DATASET_ID) =>
  ({
    mapStyleId: `style-${datasetId}-v${mapVersion}`,
    name: "Days above 32°C",
    slug: "days-above-32c",
    mapVersion,
    isLatest: false,
    methodUsedForMid: "mean",
    status: "published",
    stops: [1, 8, 31],
    binHexColors: ["#000", "#111", "#222"],
    isDiff: false,
    step: 1,
    binningType: "number",
    dataLabels: [],
    dataset: { id: datasetId },
  } as unknown as types.Map);

const makeDiffMap = (overrides: Partial<VersionDiffMap> = {}): VersionDiffMap => ({
  datasetId: DATASET_ID,
  slug: "days-above-32c",
  baseVersion: 3,
  targetVersion: 4,
  mapStyleId: "diff-v4-v3",
  unitFamily: "days",
  stops: [-30, -15, -5, 5, 15, 30],
  unitLabel: "days",
  ...overrides,
});

describe("getDiffMapsForDataset", () => {
  it("returns nothing when no dataset is given", () => {
    expect(getDiffMapsForDataset(undefined, [makeDiffMap()])).toEqual([]);
  });

  it("keeps only entries for the requested dataset", () => {
    const mine = makeDiffMap();
    const other = makeDiffMap({ datasetId: 99999 });

    expect(getDiffMapsForDataset(DATASET_ID, [mine, other])).toEqual([mine]);
  });
});

describe("getDiffMapForPair", () => {
  const registry = [makeDiffMap(), makeDiffMap({ baseVersion: 4, targetVersion: 5 })];

  it("matches on dataset and both versions", () => {
    expect(getDiffMapForPair(DATASET_ID, 4, 5, registry)?.mapStyleId).toBe("diff-v4-v3");
  });

  it("does not match a pair that was never published", () => {
    expect(getDiffMapForPair(DATASET_ID, 3, 5, registry)).toBeUndefined();
  });

  it("does not leak an entry across datasets", () => {
    expect(getDiffMapForPair(99999, 3, 4, registry)).toBeUndefined();
  });
});

describe("getAvailableDiffPairs", () => {
  it("drops a registry entry whose versions the dataset no longer has", () => {
    const versions = [makeMap(3), makeMap(4)];
    const registry = [makeDiffMap(), makeDiffMap({ baseVersion: 4, targetVersion: 5 })];

    const pairs = getAvailableDiffPairs(versions, DATASET_ID, registry);

    expect(pairs).toHaveLength(1);
    expect(pairs[0].before.mapVersion).toBe(3);
    expect(pairs[0].after.mapVersion).toBe(4);
  });

  it("orders pairs by the version being reviewed", () => {
    const versions = [makeMap(3), makeMap(4), makeMap(5)];
    const registry = [
      makeDiffMap({ baseVersion: 4, targetVersion: 5, mapStyleId: "diff-v5-v4" }),
      makeDiffMap(),
    ];

    expect(
      getAvailableDiffPairs(versions, DATASET_ID, registry).map(
        ({ diffMap }) => diffMap.mapStyleId,
      ),
    ).toEqual(["diff-v4-v3", "diff-v5-v4"]);
  });
});

describe("getDefaultDiffPair", () => {
  const versions = [makeMap(3), makeMap(4), makeMap(5)];
  const registry = [
    makeDiffMap(),
    makeDiffMap({ baseVersion: 4, targetVersion: 5, mapStyleId: "diff-v5-v4" }),
  ];

  it("keeps the pair already on screen when a difference map exists for it", () => {
    const pair = getDefaultDiffPair(versions, DATASET_ID, versions[0], versions[1], registry);

    expect(pair?.diffMap.mapStyleId).toBe("diff-v4-v3");
  });

  it("falls back to the newest pair when the current one has no difference map", () => {
    const pair = getDefaultDiffPair(versions, DATASET_ID, versions[0], versions[2], registry);

    expect(pair?.diffMap.mapStyleId).toBe("diff-v5-v4");
  });

  it("returns nothing when the dataset has no difference map at all", () => {
    expect(getDefaultDiffPair(versions, 99999, undefined, undefined, registry)).toBeUndefined();
  });
});

describe("the ramp", () => {
  it("carries one more colour than stop, as the paint expression requires", () => {
    const diffMap = makeDiffMap();

    expect(getDiffMapBinHexColors(diffMap)).toHaveLength(diffMap.stops.length + 1);
  });

  it("prefers a per-map override over the shared ramp", () => {
    const binHexColors = ["#1", "#2", "#3", "#4", "#5", "#6", "#7"];

    expect(getDiffMapBinHexColors(makeDiffMap({ binHexColors }))).toBe(binHexColors);
  });

  it("uses every hex once, so no bin reads as another", () => {
    expect(new Set(DEFAULT_DIFF_BIN_HEX_COLORS).size).toBe(DEFAULT_DIFF_BIN_HEX_COLORS.length);
  });

  it("puts the two darkest colours at the ends, not at the agreeing centre", () => {
    const darkest = [...DEFAULT_DIFF_BIN_HEX_COLORS]
      .sort((a, b) => luminance(a) - luminance(b))
      .slice(0, 2);

    expect(new Set(darkest)).toEqual(
      new Set([
        DEFAULT_DIFF_BIN_HEX_COLORS[0],
        DEFAULT_DIFF_BIN_HEX_COLORS[DEFAULT_DIFF_BIN_HEX_COLORS.length - 1],
      ]),
    );
  });

  it("keeps the neutral lighter than the mid-tones either side of it", () => {
    const neutral = DEFAULT_DIFF_BIN_HEX_COLORS[3];

    expect(luminance(neutral)).toBeGreaterThan(luminance(DEFAULT_DIFF_BIN_HEX_COLORS[1]));
    expect(luminance(neutral)).toBeGreaterThan(luminance(DEFAULT_DIFF_BIN_HEX_COLORS[5]));
  });

  it("keeps the neutral clear of the greys that mean no data", () => {
    const neutral = DEFAULT_DIFF_BIN_HEX_COLORS[3];

    NO_DATA_HEX_COLORS.forEach((grey) => {
      expect(DEFAULT_DIFF_BIN_HEX_COLORS).not.toContain(grey);
      expect(distance(neutral, grey)).toBeGreaterThan(40);
    });
  });
});

describe("the unit families", () => {
  it("keeps every stop set symmetric about zero", () => {
    Object.values(DIFF_UNIT_FAMILIES).forEach(({ stops }) => {
      expect(stops.map((stop) => -stop).reverse()).toEqual(stops);
    });
  });

  it("keeps every stop set ascending, as the paint expression requires", () => {
    Object.values(DIFF_UNIT_FAMILIES).forEach(({ stops }) => {
      expect([...stops].sort((a, b) => a - b)).toEqual(stops);
    });
  });

  it("leaves room for one colour more than stops", () => {
    Object.values(DIFF_UNIT_FAMILIES).forEach(({ stops }) => {
      expect(DEFAULT_DIFF_BIN_HEX_COLORS).toHaveLength(stops.length + 1);
    });
  });
});

describe("getDiffPairLabel", () => {
  it("names the newer version first, matching the subtraction", () => {
    expect(getDiffPairLabel(makeDiffMap())).toBe("v4 − v3");
  });
});

describe("the shipped registry", () => {
  it("declares a pending entry without exposing it to the UI", () => {
    const pending = versionDiffMaps.filter(({ mapStyleId }) => !mapStyleId);

    pending.forEach(({ datasetId, baseVersion, targetVersion }) => {
      expect(getDiffMapsForDataset(datasetId)).toEqual([]);
      expect(getDiffMapForPair(datasetId, baseVersion, targetVersion)).toBeUndefined();
    });
  });

  it("only holds entries whose ramp the paint expression can consume", () => {
    versionDiffMaps.forEach((diffMap) => {
      expect(getDiffMapBinHexColors(diffMap)).toHaveLength(diffMap.stops.length + 1);
      expect([...diffMap.stops].sort((a, b) => a - b)).toEqual(diffMap.stops);
      expect(diffMap.targetVersion).toBeGreaterThan(diffMap.baseVersion);
      // Below this the paint expression reads the value as barren land or an
      // error rather than as a difference.
      expect(diffMap.stops[0]).toBeGreaterThan(consts.BARREN_LAND_VALUE);
    });
  });

  it("labels every entry with a unit, and only from a known family's stop set", () => {
    const stopSets = Object.values(DIFF_UNIT_FAMILIES).map(({ stops }) => stops.join(","));

    versionDiffMaps.forEach(({ stops, unitLabel }) => {
      expect(unitLabel).toBeTruthy();
      expect(stopSets).toContain(stops.join(","));
    });
  });

  // Not derived from the slug: "10 hottest nights" (40206) reports a temperature,
  // so a slug containing "night" says nothing about the unit.
  it("counts nights in nights", () => {
    const nightCountingDatasets = [40202, 40203, 40204];

    nightCountingDatasets.forEach((datasetId) => {
      const entry = versionDiffMaps.find((diffMap) => diffMap.datasetId === datasetId);

      expect(entry?.unitLabel).toBe("nights");
    });
  });

  it("keeps a nights label on the days stop set — a night is still a day of the year", () => {
    versionDiffMaps
      .filter(({ unitLabel }) => unitLabel === "nights")
      .forEach(({ stops }) => expect(stops).toEqual(DIFF_UNIT_FAMILIES.days.stops));
  });

  it("holds at most one entry per dataset and version pair", () => {
    const keys = versionDiffMaps.map(
      ({ datasetId, baseVersion, targetVersion }) => `${datasetId}-${baseVersion}-${targetVersion}`,
    );

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("formatDelta", () => {
  it("signs a rise, which is otherwise indistinguishable from an absolute value", () => {
    expect(formatDelta(12)).toBe("+12");
  });

  it("leaves the minus sign to do the work for a fall", () => {
    expect(formatDelta(-12)).toBe("-12");
  });

  it("leaves zero unsigned", () => {
    expect(formatDelta(0)).toBe("0");
  });
});

describe("formatDiffValue", () => {
  it("drops a count to a whole unit, the precision the data publishes at", () => {
    expect(formatDiffValue(12.7, "days")).toBe(12);
    expect(formatDiffValue(-4.2, "millimeters")).toBe(-4);
    expect(formatDiffValue(3.9, "percent")).toBe(3);
  });

  it("truncates toward zero, matching the importer's int() rather than rounding", () => {
    expect(formatDiffValue(-3.7, "days")).toBe(-3);
    expect(formatDiffValue(3.7, "days")).toBe(3);
  });

  it("never yields a negative zero", () => {
    expect(Object.is(formatDiffValue(-0.4, "days"), -0)).toBe(false);
    expect(Object.is(formatDiffValue(-0.001, "zScore"), -0)).toBe(false);
  });

  it("keeps z-scores at the precision their stops resolve to", () => {
    expect(formatDiffValue(-0.153, "zScore")).toBe(-0.15);
    expect(Z_SCORE_DECIMALS).toBe(2);
  });

  it("collapses a non-finite value, which is ocean or an unplaceable cell", () => {
    expect(formatDiffValue(NaN, "days")).toBeUndefined();
    expect(formatDiffValue(Infinity, "zScore")).toBeUndefined();
  });
});
