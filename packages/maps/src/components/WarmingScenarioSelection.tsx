import styled from "styled-components";

import { components } from "@probable-futures/components-lib";
import { useMapData } from "../contexts/DataContext";
import { useTourData } from "../contexts/TourContext";
import { useTranslation } from "../contexts/TranslationContext";
import useDegreesSelector from "../utils/useDegreesSelector";
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
  position: absolute;
  bottom: 0;
  box-sizing: content-box;
  z-index: 3;
  width: 100%;
`;

const WarmingScenarioSelection = () => {
  const {
    selectedDataset,
    degrees,
    stories,
    showBaselineModal,
    warmingScenarioDescs,
    showMarkers,
    setShowAboutMap,
  } = useMapData();
  const { step, steps, isTourActive, onClose, onNext } = useTourData();
  const { translate } = useTranslation();
  const { onButtonClick } = useDegreesSelector();
  const isTablet = useMediaQuery({
    query: `(max-width: ${size.tabletMax})`,
  });

  if (!selectedDataset) {
    return null;
  }

  return (
    <>
      {isTablet ? (
        <MobileContainer>
          <components.DegreesFooter
            degrees={degrees}
            warmingScenarioDescs={warmingScenarioDescs}
            showBaselineModal={showBaselineModal}
            tourProps={{
              step,
              isTourActive,
              steps,
              stories,
              showMarkers,
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
            degrees={degrees}
            warmingScenarioDescs={warmingScenarioDescs}
            showBaselineModal={showBaselineModal}
            tourProps={{
              step,
              isTourActive,
              steps,
              stories,
              showMarkers,
              onNext,
              onClose,
            }}
            onWarmingScenarioClick={onButtonClick}
            translatedHeader={translate("header")}
            onAboutMapClick={() => {
              setShowAboutMap(true);
            }}
          />
        </Container>
      )}
    </>
  );
};

export default WarmingScenarioSelection;
