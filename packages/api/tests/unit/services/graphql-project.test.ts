/**
 * UNIT TESTS — src/services/graphql/project.ts
 *
 * Two exported resolvers:
 *   - datasetSignedUrls(_, args)   — wraps getSignedUrls; swallows errors → []
 *   - projectSharedData(_, args, ctx) — DB query → dedup datasets → sign URLs
 *
 * Mocks:
 *   - src/services/aws/s3.getObjectSignedUrl → don't sign against real S3
 *
 * Bug surface this targets:
 *   - The dedup branch: when two project_datasets share a partner_dataset_id,
 *     the one whose pf_dataset_id equals the project's top-level pf_dataset_id
 *     should win. This is subtle and easy to break.
 *   - URL pathname extraction: `decodeURIComponent(url.pathname).substring(1)`
 *     — strips the leading slash, decodes percent-encoded chars.
 *   - datasetSignedUrls swallows S3 errors and returns [] (silent failure;
 *     tested so the contract stays explicit).
 */

const getObjectSignedUrl = jest.fn();

jest.mock("../../../src/services/aws/s3", () => ({
  getObjectSignedUrl: (...a: unknown[]) => getObjectSignedUrl(...a),
}));
jest.mock("../../../src/utils/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  httpLogger: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import { datasetSignedUrls, projectSharedData } from "../../../src/services/graphql/project";

beforeEach(() => {
  getObjectSignedUrl.mockReset();
});

describe("datasetSignedUrls()", () => {
  it("returns one signed URL per input fileUrl, in order", async () => {
    getObjectSignedUrl
      .mockResolvedValueOnce("https://signed/a")
      .mockResolvedValueOnce("https://signed/b");

    const out = await datasetSignedUrls(
      {},
      { input: { fileUrls: ["a/x.csv", "b/y.csv"], type: "text/csv" } },
    );

    expect(out).toEqual(["https://signed/a", "https://signed/b"]);
  });

  it("infers content type from extension (.json → 'json', else 'text/csv') when no type is passed", async () => {
    getObjectSignedUrl.mockResolvedValue("https://signed/x");

    await datasetSignedUrls({}, { input: { fileUrls: ["foo/bar.json"] } });
    expect(getObjectSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ ResponseContentType: "json" }),
      expect.anything(),
    );

    getObjectSignedUrl.mockClear();
    getObjectSignedUrl.mockResolvedValue("https://signed/y");
    await datasetSignedUrls({}, { input: { fileUrls: ["foo/bar.csv"] } });
    expect(getObjectSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ ResponseContentType: "text/csv" }),
      expect.anything(),
    );
  });

  it("requests a 15-minute expiry and an attachment disposition", async () => {
    getObjectSignedUrl.mockResolvedValue("https://signed/x");
    await datasetSignedUrls({}, { input: { fileUrls: ["foo/bar.csv"] } });

    const params = getObjectSignedUrl.mock.calls[0][0];
    expect(params).toMatchObject({
      Expires: 15 * 60,
      ResponseContentDisposition: "attachment",
    });
  });

  it("swallows signing errors and returns [] (silent failure contract)", async () => {
    getObjectSignedUrl.mockRejectedValueOnce(new Error("aws boom"));
    const out = await datasetSignedUrls({}, { input: { fileUrls: ["a/x.csv"] } });
    expect(out).toEqual([]);
  });
});

describe("projectSharedData()", () => {
  function makeContext(rows: any[]) {
    return { pgClient: { query: jest.fn().mockResolvedValue({ rows }) } };
  }

  it("dedupes project_datasets by partner_dataset_id, preferring the one whose pf_dataset_id matches the project's", async () => {
    const datasets = [
      {
        partner_dataset_id: "p-1",
        pf_dataset_id: 999, // does NOT match project — first in, but should be overwritten
        original_file: "https://bucket.s3.amazonaws.com/wrong.csv",
        enriched_dataset_file: null,
        name: "wrong",
        upload_id: "u-1",
        enrich: false,
        processed_with_coordinates_file: "",
      },
      {
        partner_dataset_id: "p-1",
        pf_dataset_id: 42, // matches project — should win
        original_file: "https://bucket.s3.amazonaws.com/right.csv",
        enriched_dataset_file: null,
        name: "right",
        upload_id: "u-2",
        enrich: false,
        processed_with_coordinates_file: "",
      },
    ];
    getObjectSignedUrl.mockResolvedValue("https://signed/right");

    const out = await projectSharedData(
      {},
      { slugId: "slug" },
      makeContext([{ pf_dataset_id: 42, map_config: { foo: 1 }, project_datasets: datasets }]),
    );

    expect(out.files).toHaveLength(1);
    expect(out.files![0]).toMatchObject({ name: "right", url: "https://signed/right" });
  });

  it("does NOT overwrite an existing entry when the duplicate's pf_dataset_id does not match", async () => {
    const datasets = [
      {
        partner_dataset_id: "p-1",
        pf_dataset_id: 42,
        original_file: "https://bucket.s3.amazonaws.com/keep.csv",
        enriched_dataset_file: null,
        name: "keep",
        upload_id: "u-1",
        enrich: false,
        processed_with_coordinates_file: "",
      },
      {
        partner_dataset_id: "p-1",
        pf_dataset_id: 999,
        original_file: "https://bucket.s3.amazonaws.com/replace.csv",
        enriched_dataset_file: null,
        name: "replace",
        upload_id: "u-2",
        enrich: false,
        processed_with_coordinates_file: "",
      },
    ];
    getObjectSignedUrl.mockResolvedValue("https://signed/keep");

    const out = await projectSharedData(
      {},
      { slugId: "slug" },
      makeContext([{ pf_dataset_id: 42, map_config: {}, project_datasets: datasets }]),
    );

    expect(out.files).toHaveLength(1);
    expect(out.files![0].name).toBe("keep");
  });

  it("prefers enriched_dataset_file over original_file when both exist", async () => {
    const datasets = [
      {
        partner_dataset_id: "p-1",
        pf_dataset_id: 42,
        original_file: "https://bucket.s3.amazonaws.com/orig.csv",
        enriched_dataset_file: "https://bucket.s3.amazonaws.com/enriched.csv",
        name: "ds",
        upload_id: "u-1",
        enrich: true,
        processed_with_coordinates_file: "",
      },
    ];
    getObjectSignedUrl.mockResolvedValue("https://signed/enriched");

    await projectSharedData(
      {},
      { slugId: "slug" },
      makeContext([{ pf_dataset_id: 42, map_config: {}, project_datasets: datasets }]),
    );

    // The Key passed to S3 must come from the enriched file's pathname.
    expect(getObjectSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ Key: "enriched.csv" }),
      expect.anything(),
    );
  });

  it("decodes percent-encoded URL paths and strips the leading slash", async () => {
    const datasets = [
      {
        partner_dataset_id: "p-1",
        pf_dataset_id: 42,
        original_file: "https://bucket.s3.amazonaws.com/folder/a%20b%20c.csv",
        enriched_dataset_file: null,
        name: "spaces",
        upload_id: "u-1",
        enrich: false,
        processed_with_coordinates_file: "",
      },
    ];
    getObjectSignedUrl.mockResolvedValue("https://signed/spaces");

    await projectSharedData(
      {},
      { slugId: "slug" },
      makeContext([{ pf_dataset_id: 42, map_config: {}, project_datasets: datasets }]),
    );

    expect(getObjectSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ Key: "folder/a b c.csv" }),
      expect.anything(),
    );
  });

  it("skips datasets that have neither enriched nor original file URLs", async () => {
    const datasets = [
      {
        partner_dataset_id: "p-1",
        pf_dataset_id: 42,
        original_file: null,
        enriched_dataset_file: null,
        name: "empty",
        upload_id: "u-1",
        enrich: false,
        processed_with_coordinates_file: "",
      },
    ];

    const out = await projectSharedData(
      {},
      { slugId: "slug" },
      makeContext([{ pf_dataset_id: 42, map_config: {}, project_datasets: datasets }]),
    );

    expect(out.files).toEqual([]);
    expect(getObjectSignedUrl).not.toHaveBeenCalled();
  });

  it("populates mapConfig and pfDatasetId on the response", async () => {
    const datasets = [
      {
        partner_dataset_id: "p-1",
        pf_dataset_id: 42,
        original_file: "https://bucket.s3.amazonaws.com/x.csv",
        enriched_dataset_file: null,
        name: "ds",
        upload_id: "u-1",
        enrich: false,
        processed_with_coordinates_file: "",
      },
    ];
    getObjectSignedUrl.mockResolvedValue("https://signed/x");

    const out = await projectSharedData(
      {},
      { slugId: "slug" },
      makeContext([
        { pf_dataset_id: 42, map_config: { layers: ["a"] }, project_datasets: datasets },
      ]),
    );

    expect(out.mapConfig).toEqual({ layers: ["a"] });
    expect(out.pfDatasetId).toBe(42);
  });
});
