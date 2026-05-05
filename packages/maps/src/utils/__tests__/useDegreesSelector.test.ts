import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useDegreesSelector from "../useDegreesSelector";
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
  AnalyticsEvent: { WARMING_SCENARIO_CHANGED: "Warming Scenario Changed" },
}));

const mockSetDegrees = vi.fn();
const mockSetShowBaselineModal = vi.fn();

const defaultContext = {
  degrees: 1,
  setDegrees: mockSetDegrees,
  selectedDataset: { name: "Annual average temperature", isDiff: false },
  showBaselineModal: false,
  setShowBaselineModal: mockSetShowBaselineModal,
};

vi.mock("../../contexts/DataContext", () => ({
  useMapData: vi.fn(() => defaultContext),
}));

function mockContext(overrides: Partial<typeof defaultContext>) {
  vi.mocked(useMapData).mockReturnValue({ ...defaultContext, ...overrides } as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockContext({});
});

describe("useDegreesSelector – onButtonClick", () => {
  it("sets degrees and calls setQueryParam on a normal click", () => {
    const { result } = renderHook(() => useDegreesSelector());
    act(() => result.current.onButtonClick(1.5, false));

    expect(mockSetDegrees).toHaveBeenCalledWith(1.5);
    expect(setQueryParam).toHaveBeenCalledWith({ warmingScenario: 1.5 });
  });

  it("shows baseline modal when clicking 0.5 on an isDiff dataset", () => {
    mockContext({ selectedDataset: { name: "Some map", isDiff: true } });
    const { result } = renderHook(() => useDegreesSelector());
    act(() => result.current.onButtonClick(0.5, false));

    expect(mockSetShowBaselineModal).toHaveBeenCalledWith(true);
    expect(mockSetDegrees).not.toHaveBeenCalled();
  });

  it("shows baseline modal when clicking 0.5 on a 'change …' named dataset", () => {
    mockContext({ selectedDataset: { name: "Change in hot days", isDiff: false } });
    const { result } = renderHook(() => useDegreesSelector());
    act(() => result.current.onButtonClick(0.5, false));

    expect(mockSetShowBaselineModal).toHaveBeenCalledWith(true);
    expect(mockSetDegrees).not.toHaveBeenCalled();
  });

  it("closes modal without setting degrees when showBaselineModal is true", () => {
    mockContext({ showBaselineModal: true });
    const { result } = renderHook(() => useDegreesSelector());
    act(() => result.current.onButtonClick(0.5, false));

    expect(mockSetShowBaselineModal).toHaveBeenCalledWith(false);
    expect(mockSetDegrees).not.toHaveBeenCalled();
  });

  it("always fires trackEvent('Warming tab clicked')", () => {
    const { result } = renderHook(() => useDegreesSelector());
    act(() => result.current.onButtonClick(2, false));

    expect(trackEvent).toHaveBeenCalledWith("Warming tab clicked", expect.any(Object));
  });

  it("fires trackMixpanelEvent only when a degree change actually happens", () => {
    const { result } = renderHook(() => useDegreesSelector());
    act(() => result.current.onButtonClick(2, false));
    expect(trackMixpanelEvent).toHaveBeenCalledWith(
      "Warming Scenario Changed",
      expect.objectContaining({ warming_scenario: 2 }),
    );
  });

  it("does NOT fire trackMixpanelEvent when modal is shown instead", () => {
    mockContext({ selectedDataset: { name: "Some map", isDiff: true } });
    const { result } = renderHook(() => useDegreesSelector());
    act(() => result.current.onButtonClick(0.5, false));
    expect(trackMixpanelEvent).not.toHaveBeenCalled();
  });
});
