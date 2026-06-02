import styled from "styled-components";

import { components } from "@probable-futures/components-lib";
import { useMapData } from "../contexts/DataContext";
import { useTourData } from "../contexts/TourContext";
import { useTranslation } from "../contexts/TranslationContext";
import useDegreesSelector from "../utils/useDegreesSelector";
import { trackMixpanelEvent, AnalyticsEvent } from "../utils/mixpanelAnalytics";
import { useMediaQuery } from "react-responsive";
import { size } from "@probable-futures/lib";

const Container = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  box-sizing: content-box;
  z-index: 3;
  width: 600px;
`;

const MobileContainer = styled.div`
  position: fixed;
  bottom: 0;
  box-sizing: content-box;
  z-index: 3;
  width: 100%;
`;

const WarmingScenarioSelection = () => {
  const {
    selectedDataset,
    degrees,
    showBaselineModal,
    warmingScenarioDescs,
    setShowAboutMap,
    isComparisonMapActive,
    comparisonScenarioBefore,
    comparisonScenarioAfter,
  } = useMapData();
  const { step, steps, isTourActive, onClose, onNext } = useTourData();
  const { translate } = useTranslation();
  const { onButtonClick, pendingSide } = useDegreesSelector();
  const isTablet = useMediaQuery({
    query: `(max-width: ${size.tabletMax})`,
  });

  if (!selectedDataset) {
    return null;
  }

  const primaryDegrees = isComparisonMapActive ? comparisonScenarioBefore : degrees;
  const secondaryDegrees = isComparisonMapActive ? comparisonScenarioAfter : undefined;
  const pendingDegrees =
    pendingSide === "before"
      ? comparisonScenarioBefore
      : pendingSide === "after"
        ? comparisonScenarioAfter
        : undefined;

  return (
    <>
      {isTablet ? (
        <MobileContainer>
          <components.DegreesFooter
            degrees={primaryDegrees}
            degrees2={secondaryDegrees}
            pendingDegrees={pendingDegrees}
            warmingScenarioDescs={warmingScenarioDescs}
            showBaselineModal={showBaselineModal}
            tourProps={{
              step,
              isTourActive,
              steps,
              onNext,
              onClose,
            }}
            onWarmingScenarioClick={onButtonClick}
            degreesFooterText={translate("header")}
          />
        </MobileContainer>
      ) : (
        <Container>
          <components.Degrees
            degrees={primaryDegrees}
            degrees2={secondaryDegrees}
            pendingDegrees={pendingDegrees}
            warmingScenarioDescs={warmingScenarioDescs}
            showBaselineModal={showBaselineModal}
            tourProps={{
              step,
              isTourActive,
              steps,
              onNext,
              onClose,
            }}
            onWarmingScenarioClick={onButtonClick}
            translatedHeader={translate("header")}
            onAboutMapClick={() => {
              setShowAboutMap(true);
              trackMixpanelEvent(AnalyticsEvent.ABOUT_MAP_OPENED, {
                map_name: selectedDataset?.name,
              });
            }}
          />
        </Container>
      )}
    </>
  );
};

export default WarmingScenarioSelection;
