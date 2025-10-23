import styled from "styled-components";
import { components } from "@probable-futures/components-lib";

import { useMapData } from "../../contexts/DataContext";
import { colors, size } from "../../consts";
import MapKeyExtension from "./MapKeyExtension";
import { consts, types } from "@probable-futures/lib";
import { MediaQuery } from "react-responsive";

type Props = {
  activeSidePanel: boolean;
  isSharedProject: boolean;
  slugId: string;
  tempUnit: string;
  bins?: number[];
  precipitationUnit: types.PrecipitationUnit;
  setTempUnit: (arg: any) => void;
  setPrecipitationUnit: (arg: any) => void;
};

type MapKeyWrapperProps = {
  activeSidePanel: boolean;
  isSharedProject: boolean;
};

const MapKeyWrapper = styled.div<MapKeyWrapperProps>`
  position: absolute;
  ${({ activeSidePanel }: MapKeyWrapperProps) => !activeSidePanel && "transition: left 250ms;"}
  left: 40px;
  top: ${consts.HEADER_HEIGHT};
  right: 0;
  z-index: 1;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (min-width: ${size.tablet}) and (max-width: ${size.tabletMax}) {
    top: 0;
    z-index: 3;
    right: unset
    width: auto;
  }

  @media (min-width: ${size.laptop}) {
    left: ${({ activeSidePanel, isSharedProject }: MapKeyWrapperProps) =>
      isSharedProject ? "10px" : activeSidePanel ? "340px" : "75px"};
    top: unset;
    right: unset;
    bottom: 36px;
    z-index: 2;
    width: auto;
  }

  .map-key-container {
    border-top: 1px solid ${colors.darkPurple};
    overflow-x: auto;

    @media (min-width: ${size.tablet}) and (max-width: ${size.tabletMax}) {
      padding: 0px 18px;
      border-bottom: 1px solid ${colors.grey};
      border-top: none;
      height: 62px;
      overflow: hidden !important;
    }

    @media (min-width: ${size.laptop}) {
      border: 1px solid ${colors.grey};
      border-radius: 6px;
      padding: 12px 18px 9px;
      overflow: hidden !important;
    }

    ::-webkit-scrollbar {
      display: none !important;
    }
  }

  .climate-zones-key-container {
    width: 100vw;
    overflow-x: scroll; /* Add the ability to scroll */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    overflow-y: hidden;
    white-space: nowrap;
    padding: 10px;
    padding-left: 15px;
    border: none;
    box-sizing: content-box;
    border-top: 1px solid ${colors.darkPurple};
    border-bottom: 1px solid ${colors.darkPurple};

    @media (min-width: ${size.tablet}) and (max-width: ${size.tabletMax}) {
      border: 1px solid ${colors.grey};
      padding: 0px;
      padding-left: 16px;
      width: auto;
      height: 80px;
      overflow-x: hidden;
    }

    @media (min-width: ${size.laptop}) {
      border: 1px solid ${colors.grey};
      padding: 0px;
      padding-left: 16px;
      width: auto;
      height: 80px;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MapKey = ({
  activeSidePanel,
  isSharedProject,
  slugId,
  bins,
  tempUnit,
  precipitationUnit,
  setTempUnit,
  setPrecipitationUnit,
}: Props) => {
  const { selectedClimateData, datasetDescriptionResponse } = useMapData();

  if (!selectedClimateData) {
    return null;
  }

  return (
    <MapKeyWrapper activeSidePanel={activeSidePanel} isSharedProject={isSharedProject}>
      {datasetDescriptionResponse && (
        <components.MapKey
          stops={bins}
          tempUnit={tempUnit as types.TempUnit}
          setTempUnit={setTempUnit}
          selectedDataset={selectedClimateData}
          binHexColors={selectedClimateData.binHexColors}
          datasetDescriptionResponse={datasetDescriptionResponse}
          precipitationUnit={precipitationUnit}
          setPrecipitationUnit={setPrecipitationUnit}
        />
      )}
      <MediaQuery minWidth={size.laptop}>
        <MapKeyExtension />
      </MediaQuery>
    </MapKeyWrapper>
  );
};

export default MapKey;
