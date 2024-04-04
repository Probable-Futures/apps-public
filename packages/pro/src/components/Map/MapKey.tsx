import { useMemo } from "react";
import styled from "styled-components";
import { components } from "@probable-futures/components-lib";
import { HEADER_HEIGHT } from "@probable-futures/lib/src/consts";
import { useMediaQuery } from "react-responsive";

import { useMapData } from "../../contexts/DataContext";
import { colors, size } from "../../consts";
import MapKeyExtension from "./MapKeyExtension";
import { types } from "@probable-futures/lib";

type Props = {
  activeSidePanel: boolean;
  slugId: string;
  tempUnit: string;
  bins?: number[];
  precipitationUnit: types.PrecipitationUnit;
  setTempUnit: (arg: any) => void;
  setPrecipitationUnit: (arg: any) => void;
};

type MapKeyWrapperProps = {
  width: string;
  activeSidePanel: boolean;
};

const MapKeyWrapper = styled.div`
  position: absolute;
  ${({ activeSidePanel }: MapKeyWrapperProps) => !activeSidePanel && "transition: width 250ms;"}
  min-width: 280px;
  top: ${HEADER_HEIGHT};
  right: 0;
  z-index: 2;
  width: ${({ width }: MapKeyWrapperProps) => width};

  @media (min-width: ${size.laptop}) {
    top: 0;
    left: unset;
    z-index: 5;
    height: ${HEADER_HEIGHT};
  }

  .map-key-container {
    border-top: 1px solid ${colors.darkPurple};
    padding: 10px;
    overflow-x: auto;

    ::-webkit-scrollbar {
      display: none !important;
    }

    @media (min-width: ${size.laptop}) {
      padding: 0;
      border-bottom: none;
      border-top: none;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
  }

  .climate-zones-key-container {
    overflow-x: scroll; /* Add the ability to scroll */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    overflow-y: hidden;
    white-space: nowrap;
    padding: 10px;
    border: none;
    box-sizing: content-box;
    border-top: 1px solid ${colors.darkPurple};
    border-bottom: 1px solid ${colors.darkPurple};

    .climate-zones-bin-container {
      gap: 15px;
      margin-top: 2px;
    }

    @media (min-width: ${size.laptop}) {
      box-sizing: content-box;
      border: none;
      white-space: nowrap;
      padding: 0;
      padding-top: 5px;
    }

    ::-webkit-scrollbar {
      display: none;
    }
  }

  .map-key-header {
    margin-bottom: 0px !important;
  }

  .map-key-label {
    margin-bottom: 5px !important;
  }

  .map-key-bins-container {
    margin-right: 13px !important;
  }

  .map-key-bin-container {
    margin-right: 2px !important;
    min-width: 47px !important;
  }

  .map-key-bin {
    font-size: 9px !important;

    .dash {
      font-size: 13px !important;
    }
  }
`;

const MapKey = ({
  activeSidePanel,
  slugId,
  bins,
  tempUnit,
  precipitationUnit,
  setTempUnit,
  setPrecipitationUnit,
}: Props) => {
  const { selectedClimateData, datasetDropdownRef, datasetDescriptionResponse } = useMapData();
  const isLaptop = useMediaQuery({
    query: `(min-width: ${size.laptop})`,
  });
  const datasetDropdownWidth = datasetDropdownRef.current?.firstElementChild?.clientWidth ?? 0;

  const keyWidth = useMemo(() => {
    if (isLaptop) {
      if (slugId) {
        return `calc(100% - ${datasetDropdownWidth + 10}px)`;
      } else {
        if (activeSidePanel) {
          return `calc(100% - ${datasetDropdownWidth + 307}px)`;
        } else {
          return `calc(100% - ${datasetDropdownWidth + 50}px)`;
        }
      }
    } else {
      if (slugId) {
        return "100vw";
      } else {
        return "calc(100vw - 40px)";
      }
    }
  }, [activeSidePanel, isLaptop, slugId, datasetDropdownWidth]);

  if (!selectedClimateData) {
    return null;
  }

  return (
    <MapKeyWrapper
      width={datasetDropdownWidth ? keyWidth : "auto"}
      activeSidePanel={activeSidePanel}
    >
      {datasetDescriptionResponse && (
        <components.MapKey
          stops={bins}
          tempUnit={tempUnit as types.TempUnit}
          setTempUnit={setTempUnit}
          selectedDataset={selectedClimateData}
          binHexColors={selectedClimateData.binHexColors}
          useTabletViewOnLaptop={true}
          datasetDescriptionResponse={datasetDescriptionResponse}
          precipitationUnit={precipitationUnit}
          setPrecipitationUnit={setPrecipitationUnit}
        />
      )}
      <MapKeyExtension activeSidePanel={slugId ? false : activeSidePanel} />
    </MapKeyWrapper>
  );
};

export default MapKey;
