import styled from "styled-components";
import camelcase from "lodash.camelcase";

import { colors } from "../consts";
import { MODEL_HIDDEN_MAP_VERSION } from "../consts/mapConsts";
import { getDiffPairLabel } from "../consts/versionDiffMaps";
import { useMenu } from "./Menu";
import { getComparisonSideLabel } from "../utils/mapVersions";
import useActiveDiffMap from "../utils/useActiveDiffMap";
import useActiveEra5Map from "../utils/useActiveEra5Map";
import { ERA5_LABEL } from "../consts/era5Maps";
import { useTranslation } from "../contexts/TranslationContext";

const SIDEBAR_OPEN_OFFSET = 256;
const SIDEBAR_RAIL_OFFSET = 52;

const TITLE_RESERVED_SPACE = 50;

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

const Versions = styled.span`
  font-family: "RelativeMono";
  color: ${colors.lightGrey2};
`;

const MapBuilderHeader = () => {
  const {
    sidebar,
    data: { selectedDataset, comparisonMode, versionBefore, versionAfter },
  } = useMenu();
  const { translate } = useTranslation();
  const activeDiffMap = useActiveDiffMap();
  const activeEra5Map = useActiveEra5Map();

  if (!selectedDataset) {
    return null;
  }

  const isSwiping = comparisonMode === "swipe" && versionBefore && versionAfter;
  // ERA5 is reanalysis, not a model run, so naming a model beneath it would be wrong.
  const showModel =
    !isSwiping &&
    !activeDiffMap &&
    !activeEra5Map &&
    selectedDataset.mapVersion !== MODEL_HIDDEN_MAP_VERSION;

  return (
    <Container sidebarOpen={sidebar.isVisible}>
      <p>
        {translate(`header.datasets.${camelcase(selectedDataset.slug)}`, selectedDataset.name)}
        {isSwiping && (
          <Versions>
            {" — "}
            {`${getComparisonSideLabel(versionBefore)} vs ${getComparisonSideLabel(versionAfter)}`}
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
  );
};

export default MapBuilderHeader;
