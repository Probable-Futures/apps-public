import { describe, it, expect } from "vitest";
import { types } from "@probable-futures/lib";

import {
  findDefaultMap,
  findMapForParams,
  findMapForSlug,
  isLatestMapForSlug,
} from "../mapSelection";

type MapOverrides = {
  datasetId?: number;
  slug?: string;
  mapVersion: number;
  status?: string;
  isLatest?: boolean;
  methodUsedForMid?: string;
};

const makeMap = ({
  datasetId = 40104,
  slug = "days_above_32c",
  mapVersion,
  status = "published",
  isLatest = false,
  methodUsedForMid = "mean",
}: MapOverrides) =>
  ({
    mapStyleId: `style-${datasetId}-v${mapVersion}-${methodUsedForMid}`,
    name: "Days above 32°C",
    slug,
    mapVersion,
    isLatest,
    status,
    methodUsedForMid,
    stops: [1, 8, 31],
    binHexColors: ["#000", "#111", "#222"],
    isDiff: false,
    step: 1,
    binningType: "number",
    dataLabels: [],
    dataset: { id: datasetId },
  } as unknown as types.Map);

const legacyArchive = makeMap({
  datasetId: 20104,
  mapVersion: 1,
  status: "archive",
  isLatest: true,
});
const v1 = makeMap({ mapVersion: 1 });
const v2 = makeMap({ mapVersion: 2 });
const v3 = makeMap({ mapVersion: 3, isLatest: true });
const v4Draft = makeMap({ mapVersion: 4, status: "draft", isLatest: true });
const allMaps = [legacyArchive, v1, v2, v3, v4Draft];

describe("findMapForSlug", () => {
  it("returns undefined without a slug", () => {
    expect(findMapForSlug(allMaps, {})).toBeUndefined();
  });

  it("returns undefined when no map carries the slug", () => {
    expect(findMapForSlug(allMaps, { slug: "unknown" })).toBeUndefined();
  });

  it("ignores an archived dataset that reuses the slug and claims to be latest", () => {
    expect(findMapForSlug(allMaps, { slug: "days_above_32c", version: "latest" })).toBe(v3);
  });

  it("treats a missing version like latest", () => {
    expect(findMapForSlug(allMaps, { slug: "days_above_32c" })).toBe(v3);
  });

  it("keeps a draft out of the latest lookup until its status is asked for", () => {
    expect(findMapForSlug(allMaps, { slug: "days_above_32c", status: "published" })).toBe(v3);
    expect(findMapForSlug(allMaps, { slug: "days_above_32c", status: "draft" })).toBe(v4Draft);
  });

  it("resolves an explicit version even when its status is not the preferred one", () => {
    expect(findMapForSlug(allMaps, { slug: "days_above_32c", version: "4" })).toBe(v4Draft);
    expect(findMapForSlug(allMaps, { slug: "days_above_32c", version: "2" })).toBe(v2);
  });

  it("prefers the requested status when several datasets share a version", () => {
    const archivedV3 = makeMap({ datasetId: 20104, mapVersion: 3, status: "archive" });
    const maps = [archivedV3, v3];

    expect(findMapForSlug(maps, { slug: "days_above_32c", version: "3" })).toBe(v3);
    expect(findMapForSlug(maps, { slug: "days_above_32c", version: "3", status: "archive" })).toBe(
      archivedV3,
    );
  });

  it("falls back to another status when the requested one has no map", () => {
    expect(findMapForSlug([v3, v4Draft], { slug: "days_above_32c", status: "archive" })).toBe(v3);
  });

  it("falls back to the latest version when the requested version does not exist", () => {
    expect(findMapForSlug(allMaps, { slug: "days_above_32c", version: "9" })).toBe(v3);
  });

  it("prefers published over draft when the status filter is all", () => {
    expect(findMapForSlug(allMaps, { slug: "days_above_32c", status: "all" })).toBe(v3);
  });

  it("follows the latest flag rather than the highest version number", () => {
    const original = makeMap({ datasetId: 40703, mapVersion: 3, isLatest: true });
    const withBaseline = makeMap({ datasetId: 40703, mapVersion: 4 });
    const allAbsolute = makeMap({ datasetId: 40703, mapVersion: 5 });
    const maps = [withBaseline, allAbsolute, original];

    expect(findMapForSlug(maps, { slug: "days_above_32c" })).toBe(original);
    expect(findMapForSlug(maps, { slug: "days_above_32c", version: "5" })).toBe(allAbsolute);
  });

  it("falls back to the highest version when no map in the status carries the latest flag", () => {
    const v1Only = makeMap({ mapVersion: 1 });
    const v2Only = makeMap({ mapVersion: 2 });

    expect(findMapForSlug([v1Only, v2Only], { slug: "days_above_32c" })).toBe(v2Only);
  });
});

describe("findMapForParams", () => {
  it("still accepts a legacy map style id in place of the slug", () => {
    expect(findMapForParams(allMaps, { slug: v2.mapStyleId })).toBe(v2);
  });

  it("resolves by slug when the value is not a style id", () => {
    expect(findMapForParams(allMaps, { slug: "days_above_32c" })).toBe(v3);
  });
});

describe("isLatestMapForSlug", () => {
  it("is true only for the map a latest link resolves to", () => {
    expect(isLatestMapForSlug(allMaps, v3, "published")).toBe(true);
    expect(isLatestMapForSlug(allMaps, v4Draft, "published")).toBe(false);
    expect(isLatestMapForSlug(allMaps, v4Draft, "draft")).toBe(true);
    expect(isLatestMapForSlug(allMaps, legacyArchive, "published")).toBe(false);
  });
});

describe("findDefaultMap", () => {
  it("picks the newest published version of the first dataset", () => {
    const other = makeMap({
      datasetId: 40201,
      slug: "frost_nights",
      mapVersion: 3,
      isLatest: true,
    });

    expect(findDefaultMap([...allMaps, other])).toBe(v3);
  });

  it("skips datasets whose only maps are archived", () => {
    const other = makeMap({
      datasetId: 40201,
      slug: "frost_nights",
      mapVersion: 3,
      isLatest: true,
    });

    expect(findDefaultMap([legacyArchive, other])).toBe(other);
  });
});
