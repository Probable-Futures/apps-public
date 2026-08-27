import { describe, it, expect } from "vitest";
import { consts, types } from "@probable-futures/lib";

import {
  buildEra5Map,
  Era5Map,
  ERA5_LABEL,
  ERA5_MAP_VERSION,
  ERA5_MAX_DEGREES,
  era5Maps,
  getEra5MapForDataset,
  isEra5Map,
} from "../../consts/era5Maps";
import { getActiveMapStyleId } from "../useActiveDiffMap";
import { VersionDiffMap } from "../../consts/versionDiffMaps";

const DATASET_ID = 40104;

const makeMap = (mapVersion: number, datasetId = DATASET_ID) =>
  ({
    mapStyleId: `style-${datasetId}-v${mapVersion}`,
    name: "Days above 32°C",
    slug: "days_above_32c",
    mapVersion,
    isLatest: true,
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

const makeEra5Map = (overrides: Partial<Era5Map> = {}): Era5Map => ({
  datasetId: DATASET_ID,
  slug: "days_above_32c",
  mapStyleId: "era5-style",
  ...overrides,
});

describe("getEra5MapForDataset", () => {
  it("returns nothing when no dataset is selected", () => {
    expect(getEra5MapForDataset(undefined, [makeEra5Map()])).toBeUndefined();
  });

  it("finds the entry for the dataset on screen and ignores the others", () => {
    const wanted = makeEra5Map();
    const other = makeEra5Map({ datasetId: 40105, mapStyleId: "other-style" });

    expect(getEra5MapForDataset(DATASET_ID, [other, wanted])).toBe(wanted);
  });

  it("hides an entry whose style is not published yet, so the UI never offers it", () => {
    expect(getEra5MapForDataset(DATASET_ID, [makeEra5Map({ mapStyleId: "" })])).toBeUndefined();
  });

  it("returns nothing for a dataset with no ERA5 data at all", () => {
    expect(getEra5MapForDataset(40901, [makeEra5Map()])).toBeUndefined();
  });
});

describe("buildEra5Map", () => {
  it("keeps the dataset's own ramp — ERA5 is an absolute map, not a difference", () => {
    const selected = makeMap(4);

    const era5 = buildEra5Map(selected, makeEra5Map());

    expect(era5.stops).toBe(selected.stops);
    expect(era5.binHexColors).toBe(selected.binHexColors);
    expect(era5.dataset).toBe(selected.dataset);
    expect(era5.binningType).toBe(selected.binningType);
  });

  it("points at the registry's style rather than the version's own", () => {
    const era5 = buildEra5Map(makeMap(4), makeEra5Map({ mapStyleId: "era5-40104" }));

    expect(era5.mapStyleId).toBe("era5-40104");
  });

  it("drops the version row's identity, which does not describe observations", () => {
    const era5 = buildEra5Map(makeMap(4), makeEra5Map());

    expect(era5.mapVersion).toBe(ERA5_MAP_VERSION);
    expect(era5.isLatest).toBe(false);
    expect(era5.status).toBeUndefined();
  });
});

describe("isEra5Map", () => {
  it("recognises a synthetic ERA5 side", () => {
    expect(isEra5Map(buildEra5Map(makeMap(4), makeEra5Map()))).toBe(true);
  });

  it("is false for every real version and for no side at all", () => {
    [1, 2, 3, 4, 5].forEach((version) => expect(isEra5Map(makeMap(version))).toBe(false));
    expect(isEra5Map(undefined)).toBe(false);
  });

  // A real row can never carry the reserved number, so the tag cannot be forged
  // by a database change.
  it("reserves a version number below every real one", () => {
    expect(ERA5_MAP_VERSION).toBeLessThan(1);
  });
});

describe("getActiveMapStyleId", () => {
  const diffMap = { mapStyleId: "diff-style" } as VersionDiffMap;

  it("falls back to the dataset's own style when neither view is active", () => {
    expect(getActiveMapStyleId(makeMap(4))).toBe("style-40104-v4");
  });

  it("prefers ERA5 over the dataset's own style", () => {
    expect(getActiveMapStyleId(makeMap(4), undefined, makeEra5Map())).toBe("era5-style");
  });

  it("prefers the difference map over ERA5, so the two can never both paint", () => {
    expect(getActiveMapStyleId(makeMap(4), diffMap, makeEra5Map())).toBe("diff-style");
  });
});

describe("the warming-level ceiling", () => {
  // The reason for the constant, not just its value: these are exactly the two
  // properties the published ERA5 tiles carry.
  it("admits only the levels the tiles have data for", () => {
    const allowed = consts.degreesOptions
      .filter(({ value }) => value <= ERA5_MAX_DEGREES)
      .map(({ dataKey }) => dataKey);

    expect(allowed).toEqual(["data_baseline", "data_1c"]);
  });

  it("leaves the modelled levels above it, which ERA5 cannot observe", () => {
    const excluded = consts.degreesOptions
      .filter(({ value }) => value > ERA5_MAX_DEGREES)
      .map(({ value }) => value);

    expect(excluded).toEqual([1.5, 2, 2.5, 3]);
  });
});

describe("the shipped registry", () => {
  // The 24 datasets published with `create-tilesets -- <id> --era5`.
  const datasetsWithEra5 = [
    40101, 40102, 40103, 40104, 40105, 40106, 40107, 40201, 40202, 40203, 40204, 40205, 40206,
    40207, 40301, 40302, 40303, 40304, 40305, 40601, 40607, 40613, 40614, 40616,
  ];

  it("covers every dataset that has ERA5 tiles", () => {
    expect(era5Maps.map(({ datasetId }) => datasetId)).toEqual(datasetsWithEra5);
  });

  // Drought, water balance, wildfire, climate zones and storm frequency have no
  // ERA5 equivalent, so an entry for one would point at a style that cannot exist.
  it("holds no entry for a dataset without ERA5", () => {
    [40612, 40701, 40702, 40703, 40704, 40901].forEach((datasetId) =>
      expect(era5Maps.some((era5) => era5.datasetId === datasetId)).toBe(false),
    );
  });

  it("holds at most one entry per dataset", () => {
    const ids = era5Maps.map(({ datasetId }) => datasetId);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("names every entry, so a pending row can still be identified", () => {
    era5Maps.forEach(({ slug }) => expect(slug).toBeTruthy());
  });

  it("declares a pending entry without exposing it to the UI", () => {
    era5Maps
      .filter(({ mapStyleId }) => !mapStyleId)
      .forEach(({ datasetId }) => expect(getEra5MapForDataset(datasetId)).toBeUndefined());
  });
});

describe("the label", () => {
  it("is a proper noun, so it carries no version prefix", () => {
    expect(ERA5_LABEL).toBe("ERA5");
    expect(ERA5_LABEL).not.toContain("v");
  });
});
