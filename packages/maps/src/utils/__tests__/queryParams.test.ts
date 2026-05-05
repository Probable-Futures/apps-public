import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setQueryParam, deleteQueryParam, getQueryParam } from "../index";

function setSearch(search: string) {
  window.history.pushState({}, "", search || "/");
}

function lastReplaceStateUrl(): string {
  const replaceState = window.history.replaceState as ReturnType<typeof vi.spyOn>;
  const lastCall = replaceState.mock.lastCall;
  return lastCall ? (lastCall[2] as string) : "";
}

beforeEach(() => {
  setSearch("/");
  vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("setQueryParam", () => {
  it("sets selected_map from mapSlug", () => {
    setQueryParam({ mapSlug: "my-map" });
    expect(new URLSearchParams(lastReplaceStateUrl().replace("?", "")).get("selected_map")).toBe(
      "my-map",
    );
  });

  it("sets scenario from warmingScenario", () => {
    setQueryParam({ warmingScenario: 1.5 });
    expect(new URLSearchParams(lastReplaceStateUrl().replace("?", "")).get("scenario")).toBe("1.5");
  });

  it("preserves unrelated existing params", () => {
    setSearch("?foo=bar");
    setQueryParam({ mapSlug: "slug1" });
    const params = new URLSearchParams(lastReplaceStateUrl().replace("?", ""));
    expect(params.get("foo")).toBe("bar");
    expect(params.get("selected_map")).toBe("slug1");
  });
});

describe("deleteQueryParam", () => {
  it("removes the param when it exists", () => {
    setSearch("?scenario=1.5&foo=bar");
    deleteQueryParam("scenario");
    const params = new URLSearchParams(lastReplaceStateUrl().replace("?", ""));
    expect(params.has("scenario")).toBe(false);
    expect(params.get("foo")).toBe("bar");
  });

  it("is a no-op when param is absent", () => {
    setSearch("?foo=bar");
    deleteQueryParam("scenario");
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });
});

describe("getQueryParam", () => {
  it("returns the new param value when present", () => {
    setSearch("?selected_map=my-slug");
    expect(getQueryParam("selected_map")).toBe("my-slug");
  });

  it("falls back to old param and removes it", () => {
    setSearch("?warming_scenario=2");
    const value = getQueryParam("scenario", "warming_scenario");
    expect(value).toBe("2");
    expect(window.history.replaceState).toHaveBeenCalled();
  });

  it("returns empty string when both params are absent", () => {
    setSearch("/");
    expect(getQueryParam("scenario", "warming_scenario")).toBe("");
  });
});
