import { useCallback } from "react";
import { components, contexts } from "@probable-futures/components-lib";
import { types, consts } from "@probable-futures/lib";
import styled from "styled-components";

import { useMapData } from "../../contexts/DataContext";
import { useAppSelector } from "../../app/hooks";
import useProjectUpdate from "../../utils/useProjectUpdate";

type ContainerProps = {
  width: string;
  activeSidePanel: boolean;
};

const Container = styled.div`
  width: ${({ width }: ContainerProps) => width};
  ${({ activeSidePanel }: ContainerProps) => !activeSidePanel && "transition: width 250ms;"}
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 3;
  color: ${consts.colors.dimBlack};
  background-color: ${consts.colors.white};
  height: ${consts.HEADER_HEIGHT};
  box-sizing: content-box;
  border-bottom: 1px solid ${consts.colors.darkPurple};

  button {
    font-family: LinearSans;
  }

  @media (min-width: ${consts.size.laptop}) {
    z-index: 5;
  }
`;

const Header = ({
  headerWidth,
  activeSidePanel,
}: {
  headerWidth: string;
  activeSidePanel: boolean;
}) => {
  const {
    selectedClimateData,
    climateData,
    showDescriptionModal,
    setSelectedClimateData,
    setShowDescriptionModal,
    datasetDropdownRef,
  } = useMapData();
  const { updateProject } = useProjectUpdate();
  const slugId = useAppSelector((state) => state.project.slugId);

  const onDatasetChange = useCallback(
    async (option?: types.Option) => {
      if (!selectedClimateData || !option?.value) {
        return;
      }
      if (option.value !== selectedClimateData.slug) {
        const map = climateData.find((m) => m.slug === option.value);
        if (map) {
          if (!slugId) {
            await updateProject({ pfDatasetId: map.dataset.id, erasePfMapConfig: true });
          }
          setSelectedClimateData(map);
        }
      }
    },
    [climateData, selectedClimateData, slugId, setSelectedClimateData, updateProject],
  );

  if (!selectedClimateData) {
    return null;
  }

  return (
    <Container width={headerWidth} ref={datasetDropdownRef} activeSidePanel={activeSidePanel}>
      <contexts.ThemeProvider theme="light">
        <components.DatasetSelector
          value={{
            value: selectedClimateData?.slug || "",
            label: selectedClimateData
              ? selectedClimateData.name || selectedClimateData.dataset.name
              : "",
          }}
          datasets={climateData}
          onChange={onDatasetChange}
          onInfoClick={() => setShowDescriptionModal((show: boolean) => !show)}
          showDescriptionModal={showDescriptionModal}
        />
      </contexts.ThemeProvider>
    </Container>
  );
};

export default Header;
