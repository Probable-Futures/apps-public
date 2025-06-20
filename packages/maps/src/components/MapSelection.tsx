import camelcase from "lodash.camelcase";
import styled from "styled-components";
import { useMediaQuery } from "react-responsive";

import { components, contexts } from "@probable-futures/components-lib";
import { useMapData } from "../contexts/DataContext";
import { useTourData } from "../contexts/TourContext";
import { useTranslation } from "../contexts/TranslationContext";
import { useDatasetChangeHandler } from "../utils/useDatasetChangeHandler";
import { size } from "@probable-futures/lib";

const Container = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  box-sizing: content-box;
  z-index: 3;
`;

const MobileContainer = styled.div`
  top: 0;
  left: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  z-index: 4;

  @media (max-width: ${size.mobileMax}) {
    width: 100%;
    border-radius: 0 0 6px 6px;
    box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  }

  @media (min-width: ${size.tablet}) and (max-width: ${size.tabletMax}) {
    width: 406px;
    top: -1px;
    left: 0px;
    box-shadow: unset;
  }
`;

const MapSelection = () => {
  const { selectedDataset, stories, datasets, showMarkers, setShowAllMapsModal } = useMapData();
  const { step, steps, isTourActive, onClose, onNext } = useTourData();
  const { translate } = useTranslation();
  const translatedDatasets = translate("header")?.datasets;
  const translatedHeader = translate("header");
  const onDatasetChange = useDatasetChangeHandler();
  const isTablet = useMediaQuery({
    query: `(max-width: ${size.tabletMax})`,
  });

  if (!selectedDataset) {
    return null;
  }

  return (
    <contexts.ThemeProvider theme="light">
      {isTablet ? (
        <MobileContainer>
          <components.DatasetSelectorForMobile
            value={{
              value: selectedDataset.slug || "",
              label:
                (translatedDatasets || {})[camelcase(selectedDataset.slug)] || selectedDataset.name,
            }}
            onChange={onDatasetChange}
            datasets={datasets}
            translatedHeader={translatedHeader}
          />
        </MobileContainer>
      ) : (
        <Container>
          <components.DatasetSelector
            value={{
              value: selectedDataset.slug || "",
              label:
                (translatedDatasets || {})[camelcase(selectedDataset.slug)] || selectedDataset.name,
            }}
            onChange={onDatasetChange}
            tourProps={{
              step,
              isTourActive,
              steps,
              stories,
              showMarkers,
              onNext,
              onClose,
            }}
            datasets={datasets}
            translatedHeader={translatedHeader}
            setShowAllMapsModal={setShowAllMapsModal}
          />
        </Container>
      )}
    </contexts.ThemeProvider>
  );
};

export default MapSelection;
