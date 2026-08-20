import styled from "styled-components";
import camelcase from "lodash.camelcase";

import { colors } from "../consts";
import { ComparisonMode } from "../consts/mapConsts";
import { getDiffMapForPair, getDiffPairLabel } from "../consts/versionDiffMaps";
import { useMenu } from "./Menu";
import SegmentedControl, { Segment } from "./common/SegmentedControl";
import { getAvailableDiffPairs, getVersionsOfDataset } from "../utils/mapVersions";
import { useTranslation } from "../contexts/TranslationContext";

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-right: 66px;
  transform: ${({ sidebarOpen }: { sidebarOpen: boolean }) =>
    sidebarOpen ? "translateX(256px)" : "translateX(52px)"};

  p {
    font-size: 18px;
    line-height: 22px;
    margin: 0;
    padding: 16px 50px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const MODEL_HIDDEN_MAP_VERSION = 4;

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

  if (!selectedDataset) {
    return null;
  }

  const versions = getVersionsOfDataset(datasets, selectedDataset);
  const canCompareVersions = versions.length > 1;
  const diffPairs = getAvailableDiffPairs(versions, selectedDataset.dataset.id);
  const activeDiffMap =
    comparisonMode === "diff"
      ? getDiffMapForPair(
          selectedDataset.dataset.id,
          versionBefore?.mapVersion,
          versionAfter?.mapVersion,
        )
      : undefined;
  const isSwiping = comparisonMode === "swipe" && versionBefore && versionAfter;
  const showModel =
    !isSwiping && !activeDiffMap && selectedDataset.mapVersion !== MODEL_HIDDEN_MAP_VERSION;

  const segments: Segment<ComparisonMode>[] = [
    { value: "none", label: translate("menu.data.comparisonModes.none", "Single") },
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
    <Container sidebarOpen={sidebar.isVisible}>
      <p>
        {translate(`header.datasets.${camelcase(selectedDataset.slug)}`, selectedDataset.name)}
        {isSwiping && (
          <Versions>
            {" — "}
            {`v${versionBefore.mapVersion} vs v${versionAfter.mapVersion}`}
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
      {canCompareVersions && (
        <ModeSwitch>
          <SegmentedControl
            name={translate("menu.data.comparison", "Comparison")}
            value={comparisonMode}
            segments={segments}
            onChange={onModeChange}
            compact
          />
        </ModeSwitch>
      )}
    </Container>
  );
};

export default MapBuilderHeader;
