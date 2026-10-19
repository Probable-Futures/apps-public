import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWPJson, headers } from "../useWPApi";

const url = "https://probablefutures.org/wp-json/acf/v3/options/map-settings";

function stubFetch(result: Promise<Response>) {
  const fetchMock = vi.fn().mockReturnValue(result);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchWPJson", () => {
  it("resolves with the parsed body of a successful response", async () => {
    const fetchMock = stubFetch(
      Promise.resolve(new Response(JSON.stringify({ acf: { description_1: "One" } }))),
    );

    await expect(fetchWPJson(url)).resolves.toEqual({ acf: { description_1: "One" } });
    expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ headers }));
  });

  it("resolves with undefined when a 200 response has an empty body", async () => {
    stubFetch(Promise.resolve(new Response("", { status: 200 })));

    await expect(fetchWPJson(url)).resolves.toBeUndefined();
  });

  it("resolves with undefined without parsing the body of a non-2xx response", async () => {
    const response = new Response("<html>Blocked by proxy</html>", { status: 403 });
    const json = vi.spyOn(response, "json");
    stubFetch(Promise.resolve(response));

    await expect(fetchWPJson(url)).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it("resolves with undefined when the request fails", async () => {
    stubFetch(Promise.reject(new TypeError("Load failed")));

    await expect(fetchWPJson(url)).resolves.toBeUndefined();
  });
});
