import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDatasetChangeHandler } from "../useDatasetChangeHandler";
import { useMapData } from "../../contexts/DataContext";
import { setQueryParam } from "../index";
import { trackEvent } from "../analytics";
import { trackMixpanelEvent } from "../mixpanelAnalytics";

// ── mocks ──────────────────────────────────────────────────────────────────
vi.mock("../index", () => ({
  setQueryParam: vi.fn(),
  deleteQueryParam: vi.fn(),
  getQueryParam: vi.fn(),
}));

vi.mock("../analytics", () => ({ trackEvent: vi.fn() }));
vi.mock("../mixpanelAnalytics", () => ({
  trackMixpanelEvent: vi.fn(),
  AnalyticsEvent: { MAP_CHANGED: "Map Changed" },
}));

const mockSetDegrees = vi.fn();
const mockSetSelectedDataset = vi.fn();

const normalDataset = {
  slug: "annual-temperature",
  name: "Annual Temperature",
  isDiff: false,
  isLatest: true,
};
const diffDataset = {
  slug: "change-hot-days",
  name: "Change in hot days",
  isDiff: true,
  isLatest: true,
};

const defaultContext = {
  datasets: [normalDataset, diffDataset],
  degrees: 1,
  setDegrees: mockSetDegrees,
  setSelectedDataset: mockSetSelectedDataset,
};

vi.mock("../../contexts/DataContext", () => ({
  useMapData: vi.fn(() => defaultContext),
  defaultDegreesForChangeMaps: 1,
}));

function mockContext(overrides: Partial<typeof defaultContext>) {
  vi.mocked(useMapData).mockReturnValue({ ...defaultContext, ...overrides } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockContext({});
});

describe("useDatasetChangeHandler", () => {
  it("calls setSelectedDataset with the matching dataset object", () => {
    const { result } = renderHook(() => useDatasetChangeHandler());
    act(() => result.current({ value: "annual-temperature", label: "" }));
    expect(mockSetSelectedDataset).toHaveBeenCalledWith(normalDataset);
  });

  it("does nothing for an unknown slug", () => {
    const { result } = renderHook(() => useDatasetChangeHandler());
    act(() => result.current({ value: "unknown-slug", label: "" }));
    expect(mockSetSelectedDataset).not.toHaveBeenCalled();
  });

  it("calls setDegrees(1) when degrees===0.5 and isDiff dataset selected", () => {
    mockContext({ degrees: 0.5 });
    const { result } = renderHook(() => useDatasetChangeHandler());
    act(() => result.current({ value: "change-hot-days", label: "" }));
    expect(mockSetDegrees).toHaveBeenCalledWith(1);
  });

  it("calls setQueryParam with mapSlug and version:'latest'", () => {
    const { result } = renderHook(() => useDatasetChangeHandler());
    act(() => result.current({ value: "annual-temperature", label: "" }));
    expect(setQueryParam).toHaveBeenCalledWith(
      expect.objectContaining({ mapSlug: "annual-temperature", version: "latest" }),
    );
  });

  it("fires trackEvent('Map viewed') and trackMixpanelEvent on successful selection", () => {
    const { result } = renderHook(() => useDatasetChangeHandler());
    act(() => result.current({ value: "annual-temperature", label: "" }));
    expect(trackEvent).toHaveBeenCalledWith("Map viewed", expect.any(Object));
    expect(trackMixpanelEvent).toHaveBeenCalledWith(
      "Map Changed",
      expect.objectContaining({ map_slug: "annual-temperature" }),
    );
  });

  it("passes through a custom source to trackMixpanelEvent", () => {
    const { result } = renderHook(() => useDatasetChangeHandler("sidebar"));
    act(() => result.current({ value: "annual-temperature", label: "" }));
    expect(trackMixpanelEvent).toHaveBeenCalledWith(
      "Map Changed",
      expect.objectContaining({ source: "sidebar" }),
    );
  });
});
