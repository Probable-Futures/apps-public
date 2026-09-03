import { describe, it, expect } from "vitest";
import { types } from "@probable-futures/lib";

import { getMapCoverage } from "../mapCoverage";

const makeMap = ({
  datasetId,
  mapVersion,
  name = "Days above 32°C",
  isLatest = false,
}: {
  datasetId: number;
  mapVersion: number;
  name?: string;
  isLatest?: boolean;
}) =>
  ({
    mapStyleId: `style-${datasetId}-v${mapVersion}`,
    name,
    slug: "days_above_32c",
    mapVersion,
    isLatest,
    isDiff: false,
    methodUsedForMid: "mean",
    status: "published",
    stops: [1],
    binHexColors: ["#000"],
    step: 1,
    binningType: "number",
    dataLabels: [],
    dataset: { id: datasetId },
  } as unknown as types.Map);

describe("getMapCoverage", () => {
  it("collapses a dataset's rows into one, listing its versions", () => {
    const rows = getMapCoverage([
      makeMap({ datasetId: 40104, mapVersion: 4 }),
      makeMap({ datasetId: 40104, mapVersion: 3 }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].versions).toEqual([3, 4]);
  });

  it("does not double count rows that differ only by mid-value method", () => {
    const rows = getMapCoverage([
      makeMap({ datasetId: 40104, mapVersion: 3 }),
      makeMap({ datasetId: 40104, mapVersion: 3 }),
    ]);
    expect(rows[0].versions).toEqual([3]);
  });

  it("names a dataset from its latest row, not whichever came first", () => {
    const rows = getMapCoverage([
      makeMap({ datasetId: 40104, mapVersion: 3, name: "Old name" }),
      makeMap({ datasetId: 40104, mapVersion: 4, name: "Current name", isLatest: true }),
    ]);
    expect(rows[0].name).toBe("Current name");
  });

  it("reports the hand-registered renderings", () => {
    const rows = getMapCoverage([
      makeMap({ datasetId: 40601, mapVersion: 3 }),
      makeMap({ datasetId: 40104, mapVersion: 3 }),
    ]);
    const precipitation = rows.find(({ datasetId }) => datasetId === 40601);
    const daysAbove = rows.find(({ datasetId }) => datasetId === 40104);
    expect(precipitation).toMatchObject({ hasEra5: true, hasAbsolute: true });
    expect(daysAbove).toMatchObject({ hasEra5: true, hasAbsolute: false });
  });

  it("sorts by name so the table reads alphabetically", () => {
    const rows = getMapCoverage([
      makeMap({ datasetId: 40901, mapVersion: 3, name: "Zebra" }),
      makeMap({ datasetId: 40902, mapVersion: 3, name: "Apple" }),
    ]);
    expect(rows.map(({ name }) => name)).toEqual(["Apple", "Zebra"]);
  });

  it("leaves out legacy datasets, which can repeat a current dataset's name", () => {
    const rows = getMapCoverage([
      makeMap({ datasetId: 30101, mapVersion: 3, name: "Average temperature" }),
      makeMap({ datasetId: 40101, mapVersion: 3, name: "Average temperature" }),
    ]);
    expect(rows.map(({ datasetId }) => datasetId)).toEqual([40101]);
  });

  it("returns nothing for an empty dataset list", () => {
    expect(getMapCoverage([])).toEqual([]);
  });
});
