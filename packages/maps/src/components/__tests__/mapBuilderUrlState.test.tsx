import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import maps from "./mapBuilderUrlState.fixture.json";

import { MenuProvider, useMenu } from "../Menu";
import useActiveDiffMap, { getActiveMapStyleId } from "../../utils/useActiveDiffMap";

vi.mock("@apollo/client", () => ({
  useQuery: () => ({ data: { pfMaps: { nodes: maps } } }),
  gql: (strings: unknown) => strings,
}));
vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => ({ isAuthenticated: false }) }));
vi.mock("../../utils/useWPApi", () => ({ default: () => {} }));
vi.mock("../../contexts/TranslationContext", () => ({
  useTranslation: () => ({
    translate: (key: string, fallback?: string) => fallback ?? key,
    locale: "en",
  }),
}));
vi.mock("@probable-futures/components-lib", () => {
  const Stub = () => null;
  return {
    components: {
      Binning: Stub,
      InputRadio: Stub,
      MapKey: Stub,
      DegreeSlider: Stub,
      PopupContent: Stub,
    },
    contexts: { ThemeProvider: ({ children }: { children: JSX.Element }) => children },
  };
});

const DIFF_STYLE_ID = "cmt05whxc000501qz3uuvd395";
const V3_STYLE_ID = "cli004t7p02av01quclg5aoqe";
const V4_DRAFT_STYLE_ID = "cmsyinukc007p01qy7kgpbmb2";

const stylesTheMapWasGiven: string[] = [];

/**
 * Mirrors the gate and the style choice `MapBuilder` makes, so the recorded
 * history is every style Mapbox would have been asked to render — the plain
 * style must never appear on a difference link, or the map is created with it
 * and the later switch is dropped while the first style is still loading.
 */
const MapProbe = () => {
  const {
    data: { selectedDataset, comparisonMode, comparisonRestored, versionBefore, versionAfter },
  } = useMenu();
  const activeDiffMap = useActiveDiffMap();
  const styleId = getActiveMapStyleId(selectedDataset, activeDiffMap);
  const mounted = !!selectedDataset && comparisonRestored;

  if (mounted && styleId) {
    stylesTheMapWasGiven.push(styleId);
  }

  return (
    <div data-testid="probe">
      {JSON.stringify({
        mounted,
        styleId: mounted ? styleId : undefined,
        selected: selectedDataset && `v${selectedDataset.mapVersion} ${selectedDataset.status}`,
        comparisonMode,
        before: versionBefore?.mapVersion,
        after: versionAfter?.mapVersion,
      })}
    </div>
  );
};

const openLink = async (search: string) => {
  window.history.pushState({}, "", `/en/mapBuilder${search}#2.75/34.64/-88.17`);
  render(
    <MenuProvider>
      <MapProbe />
    </MenuProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("probe").textContent).toContain('"mounted":true'));
  return JSON.parse(screen.getByTestId("probe").textContent!);
};

const uniqueStyles = () => [...new Set(stylesTheMapWasGiven)];

beforeEach(() => {
  stylesTheMapWasGiven.length = 0;
});

describe("opening a map builder link", () => {
  it("restores a difference link and never renders the plain style", async () => {
    const state = await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&status=draft&view=mercator&scenario=2&compare=diff&version_before=3&version_after=4",
    );

    expect(state.comparisonMode).toBe("diff");
    expect(state.before).toBe(3);
    expect(state.after).toBe(4);
    expect(state.selected).toBe("v4 draft");
    expect(uniqueStyles()).toEqual([DIFF_STYLE_ID]);
  });

  it("restores a difference link without an explicit status", async () => {
    const state = await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=2&compare=diff&version_before=3&version_after=4",
    );

    expect(state.comparisonMode).toBe("diff");
    expect(state.selected).toBe("v3 published");
    expect(uniqueStyles()).toEqual([DIFF_STYLE_ID]);
  });

  it("defaults to the newest difference pair when only the mode is linked", async () => {
    const state = await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=2&compare=diff",
    );

    expect(state.comparisonMode).toBe("diff");
    expect(state.before).toBe(3);
    expect(state.after).toBe(4);
    expect(uniqueStyles()).toEqual([DIFF_STYLE_ID]);
  });

  it("renders the plain style for a link without a comparison", async () => {
    const state = await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=2",
    );

    expect(state.comparisonMode).toBe("none");
    expect(uniqueStyles()).toEqual([V3_STYLE_ID]);
  });

  it("renders the requested draft version when no comparison is linked", async () => {
    const state = await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=4&status=draft&view=mercator&scenario=2",
    );

    expect(state.selected).toBe("v4 draft");
    expect(uniqueStyles()).toEqual([V4_DRAFT_STYLE_ID]);
  });

  it("keeps the map position in the hash", async () => {
    await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=2&compare=diff&version_before=3&version_after=4",
    );

    expect(window.location.hash).toBe("#2.75/34.64/-88.17");
  });
});
