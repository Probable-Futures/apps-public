import styled from "styled-components";
import camelcase from "lodash.camelcase";

import { colors } from "../consts";
import { ComparisonMode, MODEL_HIDDEN_MAP_VERSION } from "../consts/mapConsts";
import { getDiffPairLabel } from "../consts/versionDiffMaps";
import { useMenu } from "./Menu";
import SegmentedControl, { Segment } from "./common/SegmentedControl";
import {
  getAvailableDiffPairs,
  getComparisonSideLabel,
  getVersionsOfDataset,
} from "../utils/mapVersions";
import useActiveDiffMap from "../utils/useActiveDiffMap";
import useActiveEra5Map from "../utils/useActiveEra5Map";
import { ERA5_LABEL, getEra5MapForDataset } from "../consts/era5Maps";
import { useTranslation } from "../contexts/TranslationContext";

const SIDEBAR_OPEN_OFFSET = 256;
const SIDEBAR_RAIL_OFFSET = 52;

const TITLE_RESERVED_SPACE = 50 + 320;

const Container = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background-color: ${colors.white};
  border-bottom: 1px solid ${colors.lightGrey};
  z-index: 2;
  transition: transform 0.7s ease;
  box-sizing: border-box;
  transform: ${({ sidebarOpen }: { sidebarOpen: boolean }) =>
    sidebarOpen ? `translateX(${SIDEBAR_OPEN_OFFSET}px)` : `translateX(${SIDEBAR_RAIL_OFFSET}px)`};

  p {
    font-size: 18px;
    line-height: 22px;
    margin: 0;
    padding: 16px 50px;
    /* Capped against the viewport, not the bar, whose right edge is off screen.
       Worst case is the sidebar open, so reserve from that offset. */
    max-width: calc(100vw - ${SIDEBAR_OPEN_OFFSET + TITLE_RESERVED_SPACE}px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-sizing: border-box;
  }
`;

const HeaderControls = styled.div`
  position: absolute;
  top: 0;
  right: 10px;
  height: 52px;
  z-index: 3;
  display: flex;
  align-items: center;
`;

const Versions = styled.span`
  font-family: "RelativeMono";
  color: ${colors.lightGrey2};
`;

const ModeSwitch = styled.div`
  flex: 0 0 auto;
  width: 300px;
`;

const MapBuilderHeader = () => {
  const {
    sidebar,
    data: {
      datasets,
      selectedDataset,
      comparisonMode,
      versionBefore,
      versionAfter,
      setComparisonMode,
      setVersionBefore,
      setVersionAfter,
    },
  } = useMenu();
  const { translate } = useTranslation();
  const activeDiffMap = useActiveDiffMap();
  const activeEra5Map = useActiveEra5Map();

  if (!selectedDataset) {
    return null;
  }

  const versions = getVersionsOfDataset(datasets, selectedDataset);
  // ERA5 is comparable even against a lone version, so it widens the gate.
  const canCompare = versions.length > 1 || !!getEra5MapForDataset(selectedDataset.dataset.id);
  const diffPairs = getAvailableDiffPairs(versions, selectedDataset.dataset.id);
  const isSwiping = comparisonMode === "swipe" && versionBefore && versionAfter;
  // ERA5 is reanalysis, not a model run, so naming a model beneath it would be wrong.
  const showModel =
    !isSwiping &&
    !activeDiffMap &&
    !activeEra5Map &&
    selectedDataset.mapVersion !== MODEL_HIDDEN_MAP_VERSION;

  const segments: Segment<ComparisonMode>[] = [
    { value: "none", label: translate("menu.data.comparisonModes.none", "Off") },
    { value: "swipe", label: translate("menu.data.comparisonModes.swipe", "Side by side") },
    {
      value: "diff",
      label: translate("menu.data.comparisonModes.diff", "Difference"),
      disabled: diffPairs.length === 0,
      hint:
        diffPairs.length === 0
          ? translate(
              "menu.data.noDiffMapHint",
              "No difference map has been published for this dataset.",
            )
          : undefined,
    },
  ];

  const onModeChange = (mode: ComparisonMode) => {
    if (mode === "none") {
      setVersionBefore(undefined);
      setVersionAfter(undefined);
    } else if (mode === "diff") {
      const pair =
        diffPairs.find(
          ({ diffMap }) =>
            diffMap.baseVersion === versionBefore?.mapVersion &&
            diffMap.targetVersion === versionAfter?.mapVersion,
        ) ?? diffPairs[diffPairs.length - 1];
      if (!pair) {
        return;
      }
      setVersionBefore(pair.before);
      setVersionAfter(pair.after);
    }
    setComparisonMode(mode);
  };

  return (
    <>
      <Container sidebarOpen={sidebar.isVisible}>
        <p>
          {translate(`header.datasets.${camelcase(selectedDataset.slug)}`, selectedDataset.name)}
          {isSwiping && (
            <Versions>
              {" — "}
              {`${getComparisonSideLabel(versionBefore)} vs ${getComparisonSideLabel(
                versionAfter,
              )}`}
            </Versions>
          )}
          {activeEra5Map && (
            <Versions>
              {" — "}
              {ERA5_LABEL}
            </Versions>
          )}
          {activeDiffMap && (
            <Versions>
              {" — "}
              {translate("menu.data.difference", "difference")} {getDiffPairLabel(activeDiffMap)}
            </Versions>
          )}
          {showModel && ` - ${selectedDataset.dataset.model}`}
        </p>
      </Container>
      {canCompare && (
        <HeaderControls>
          <ModeSwitch>
            <SegmentedControl
              name={translate("menu.data.comparison", "Comparison")}
              value={comparisonMode}
              segments={segments}
              onChange={onModeChange}
              compact
            />
          </ModeSwitch>
        </HeaderControls>
      )}
    </>
  );
};

export default MapBuilderHeader;
