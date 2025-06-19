import { useState } from "react";
import { components, contexts } from "@probable-futures/components-lib";
import { consts, size } from "@probable-futures/lib";
import styled from "styled-components";

import { useMapData } from "../../contexts/DataContext";
import { useDatasetChangeHandler } from "../../utils/useDatasetChangeHandler";
import { useMediaQuery } from "react-responsive";

type DesktopContainerProps = {
  activeSidePanel: boolean;
};

const DesktopContainer = styled.div`
  ${({ activeSidePanel }: DesktopContainerProps) => !activeSidePanel && "transition: left 250ms;"}
  left: ${({ activeSidePanel }: DesktopContainerProps) => (activeSidePanel ? "340px" : "75px")};
  display: block;
  position: absolute;
  top: 10px;
  z-index: 3;
  color: ${consts.colors.dimBlack};
  height: ${consts.HEADER_HEIGHT};
  box-sizing: content-box;

  button {
    font-family: LinearSans;
  }

  @media (min-width: ${consts.size.laptop}) {
    z-index: 5;
  }
`;

const MobileContainer = styled.div`
  top: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  z-index: 5;
  border-radius: 0 0 6px 6px;
  width: calc(100% - 40px);
  margin-left: 40px;
`;

const MapSelection = ({ activeSidePanel }: { activeSidePanel: boolean }) => {
  const { selectedClimateData, climateData } = useMapData();
  const [showAllMapsModal, setShowAllMapsModal] = useState(false);

  const isTablet = useMediaQuery({
    query: `(max-width: ${size.tabletMax})`,
  });
  const onDatasetChange = useDatasetChangeHandler();

  if (!selectedClimateData) {
    return null;
  }

  return (
    <>
      <contexts.ThemeProvider theme="light">
        {isTablet ? (
          <MobileContainer>
            <components.DatasetSelectorForMobile
              value={{
                value: selectedClimateData?.slug || "",
                label: selectedClimateData
                  ? selectedClimateData.name || selectedClimateData.dataset.name
                  : "",
              }}
              datasets={climateData}
              onChange={onDatasetChange}
            />
          </MobileContainer>
        ) : (
          <DesktopContainer activeSidePanel={activeSidePanel}>
            <components.DatasetSelector
              value={{
                value: selectedClimateData?.slug || "",
                label: selectedClimateData
                  ? selectedClimateData.name || selectedClimateData.dataset.name
                  : "",
              }}
              datasets={climateData}
              onChange={onDatasetChange}
              setShowAllMapsModal={setShowAllMapsModal}
            />
          </DesktopContainer>
        )}
      </contexts.ThemeProvider>
      <components.AllMapsModal
        value={{
          value: selectedClimateData.slug || "",
          label: selectedClimateData.name,
        }}
        datasets={climateData}
        isVisible={showAllMapsModal}
        onClose={() => setShowAllMapsModal(false)}
        onChange={onDatasetChange}
      />
    </>
  );
};

export default MapSelection;
