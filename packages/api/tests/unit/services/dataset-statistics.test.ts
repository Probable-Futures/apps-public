/**
 * UNIT TESTS — src/services/graphql/dataset-statistics.ts
 *
 * includeClimateZoneName(statisticsResponse, pgClient) runs after every
 * getDatasetStatistics mutation. It reads the climate zones bin labels and
 * writes info.climateZoneName on rows for dataset 40901.
 *
 * Bug surface this targets:
 *   - The bin labels query runs once per mutation that returns a climate
 *     zones row, and not at all for other datasets.
 *   - Every row still gets an `info` object, with or without the lookup.
 *   - midValue is a 1-based index into bin_labels.
 */

import { includeClimateZoneName } from "../../../src/services/graphql/dataset-statistics";

const row = (datasetId: number, midValue: string | number) => ({
  "@datasetStatisticsResponses": {
    datasetId,
    name: "name",
    unit: "unit",
    warmingScenario: "1.5",
    lowValue: 0,
    midValue,
    highValue: 0,
    longitude: 0,
    latitude: 0,
    map_category: "",
    x: [],
    y: [],
  } as any,
});

const makePgClient = (binLabels: string[]) => ({
  query: jest.fn().mockResolvedValue({ rows: [{ bin_labels: binLabels }] }),
});

describe("includeClimateZoneName()", () => {
  it("skips the bin labels query when no row is from the climate zones dataset", async () => {
    const pgClient = makePgClient(["Tropical"]);
    const response = { data: [row(40104, "12.5"), row(40601, 3)] };

    const out = await includeClimateZoneName(response, pgClient);

    expect(pgClient.query).not.toHaveBeenCalled();
    expect(out.data.map((r) => r["@datasetStatisticsResponses"].info)).toEqual([{}, {}]);
  });

  it("queries the bin labels once and names each climate zones row by its midValue", async () => {
    const pgClient = makePgClient(["Tropical rainforest", "Tropical monsoon", "Savanna"]);
    const response = { data: [row(40901, "3"), row(40104, "12.5"), row(40901, 1)] };

    const out = await includeClimateZoneName(response, pgClient);

    expect(pgClient.query).toHaveBeenCalledTimes(1);
    expect(out.data.map((r) => r["@datasetStatisticsResponses"].info)).toEqual([
      { climateZoneName: "Savanna" },
      {},
      { climateZoneName: "Tropical rainforest" },
    ]);
  });

  it("returns the response untouched when there is no data", async () => {
    const pgClient = makePgClient([]);
    const response = { data: undefined } as any;

    await expect(includeClimateZoneName(response, pgClient)).resolves.toBe(response);
    expect(pgClient.query).not.toHaveBeenCalled();
  });
});
