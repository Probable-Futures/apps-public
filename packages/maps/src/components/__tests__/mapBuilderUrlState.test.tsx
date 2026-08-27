import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import maps from "./mapBuilderUrlState.fixture.json";

import { MenuProvider, useMenu } from "../Menu";
import useActiveDiffMap, { getActiveMapStyleId } from "../../utils/useActiveDiffMap";
import useActiveEra5Map from "../../utils/useActiveEra5Map";
import { getComparisonSideLabel } from "../../utils/mapVersions";

/** The fixture's 40303 has ERA5, but every shipped style id is still pending. */
const { ERA5_STYLE_ID } = vi.hoisted(() => ({ ERA5_STYLE_ID: "era5-40303-style" }));

vi.mock("../../consts/era5Maps", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../consts/era5Maps")>();
  const registry = [
    { datasetId: 40303, slug: "days_above_30c_wet-bulb", mapStyleId: ERA5_STYLE_ID },
  ];
  return {
    ...actual,
    era5Maps: registry,
    getEra5MapForDataset: (datasetId?: number, override = registry) =>
      actual.getEra5MapForDataset(datasetId, override),
  };
});

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
  const activeEra5Map = useActiveEra5Map();
  const styleId = getActiveMapStyleId(selectedDataset, activeDiffMap, activeEra5Map);
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
        beforeLabel: versionBefore && getComparisonSideLabel(versionBefore),
        afterLabel: versionAfter && getComparisonSideLabel(versionAfter),
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

describe("opening an ERA5 link", () => {
  it("gives the map the ERA5 style and never the model one", async () => {
    const state = await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=1&era5=1",
    );

    expect(state.comparisonMode).toBe("none");
    expect(uniqueStyles()).toEqual([ERA5_STYLE_ID]);
  });

  it("keeps the flag in the url so the link round-trips", async () => {
    await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=1&era5=1",
    );

    expect(new URLSearchParams(window.location.search).get("era5")).toBe("1");
  });

  // 40101 is in the shipped registry but not in the test one, standing in for a
  // dataset whose ERA5 style is not published.
  it("falls back to the model style and drops the flag when no ERA5 map exists", async () => {
    await openLink("?selected_map=average_temperature&version=latest&view=mercator&era5=1");

    expect(uniqueStyles()).toEqual([expect.not.stringContaining(ERA5_STYLE_ID)]);
    expect(new URLSearchParams(window.location.search).get("era5")).toBeNull();
  });

  it("clamps a linked warming level the ERA5 tiles have no data for", async () => {
    await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=3&compare=swipe&version_before=3&version_after=era5",
    );

    await waitFor(() =>
      expect(new URLSearchParams(window.location.search).get("scenario")).toBe("1"),
    );
  });

  it("restores an ERA5 side of a side-by-side link", async () => {
    const state = await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=1&compare=swipe&version_before=3&version_after=era5",
    );

    expect(state.comparisonMode).toBe("swipe");
    expect(state.beforeLabel).toBe("v3");
    expect(state.afterLabel).toBe("ERA5");
  });

  it("writes the ERA5 side back as a name, never as its reserved version number", async () => {
    await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=1&compare=swipe&version_before=3&version_after=era5",
    );
    const params = new URLSearchParams(window.location.search);

    expect(params.get("version_before")).toBe("3");
    expect(params.get("version_after")).toBe("era5");
  });

  it("drops the main-map flag while a comparison is open, so the two cannot fight", async () => {
    await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=1&era5=1&compare=swipe&version_before=3&version_after=4",
    );

    expect(new URLSearchParams(window.location.search).get("era5")).toBeNull();
  });

  /**
   * The ERA5 side is a fresh object unless the caller memoizes it, which would
   * make the reconcile effect set state on every pass. A settled load asks
   * Mapbox for each style once.
   */
  it("settles instead of re-resolving the ERA5 side forever", async () => {
    await openLink(
      "?selected_map=days_above_30c_wet-bulb&version=latest&view=mercator&scenario=1&compare=swipe&version_before=3&version_after=era5",
    );

    expect(uniqueStyles().length).toBe(1);
    expect(stylesTheMapWasGiven.length).toBeLessThan(6);
  });
});
