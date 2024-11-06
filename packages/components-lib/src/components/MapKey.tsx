import { PropsWithChildren } from "react";
import styled from "styled-components";
import { useMediaQuery } from "react-responsive";
import camelcase from "lodash.camelcase";
import { colors, size } from "@probable-futures/lib/src/consts";
import { getBinLabel } from "@probable-futures/lib/src/utils";
import {
  DatasetDescriptionResponse,
  Map,
  TempUnit,
  PrecipitationUnit,
} from "@probable-futures/lib/src/types";

import Switch from "./Switch";
import ClimateZonesKey from "./ClimateZonesKey";

type Props = {
  selectedDataset?: Map;
  tempUnit: TempUnit;
  stops?: number[];
  binHexColors?: string[];
  useTabletViewOnLaptop?: boolean;
  mapKeyText?: any;
  datasetDescriptionResponse?: DatasetDescriptionResponse;
  setTempUnit: (arg: TempUnit) => void;
  setPrecipitationUnit: (arg: PrecipitationUnit) => void;
  activateClimateZoneLayer?: (value?: string[]) => void;
  activeClimateZoneLayers?: string[];
  precipitationUnit: PrecipitationUnit;
};

const Container = styled.div`
  background-color: ${colors.white};
  border-bottom: 1px solid ${colors.darkPurple};
  padding: 12px 18px 9px;
  box-sizing: initial;
`;

const Content = styled.div`
  display: inline-block;
  width: unset;

  @media (min-width: 385px) {
    width: 100%;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0px;

  @media (min-width: ${size.laptop}) {
    margin-bottom: 10px;
  }
`;

const Label = styled.span`
  display: block;
  font-size: 10px;
  color: ${colors.darkPurple};
  font-weight: 600;
  letter-spacing: 0.8px;
  line-height: 11px;
  text-transform: uppercase;
  margin-bottom: 5px;

  @media (min-width: ${size.laptop}) {
    margin-bottom: 8px;
  }
`;

const Row = styled.div`
  display: flex;
  width: 100%;
  gap: 5px;
`;

const BinContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 2px;
  min-width: 48px;
  flex: 1;
  max-width: 120px;

  @media (orientation: landscape) {
    min-width: 48px;
  }

  @media (min-width: ${size.tablet}) {
    min-width: 47px;
  }

  @media (min-width: ${size.laptop}) {
    margin-right: 3px;
    min-width: 80px;
  }
`;

const BinsContainer = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;

  @media (min-width: ${size.tablet}) {
    margin-right: 13px;
  }

  @media (min-width: ${size.laptop}) {
    margin-right: 0;
  }
`;

const Color = styled.div`
  height: 12px;
  background-color: ${({ value }: { value: string }) => value};

  @media (min-width: ${size.laptop}) {
    height: 14px;
  }
`;

const Bin = styled.span`
  font-family: "RelativeMono", Courier, monospace;
  color: ${colors.darkPurple};
  font-size: 9px;
  letter-spacing: 0;
  line-height: 16px;
  text-align: center;
  margin-top: 2px;
  display: flex;
  justify-content: space-evenly;

  .dash {
    font-size: 13px;
  }

  @media (orientation: landscape) {
    font-size: 10px;
  }

  @media (min-width: ${size.tablet}) {
    font-size: 9px;
  }

  @media (min-width: ${size.laptop}) {
    font-size: 13px;
    margin-top: 4px;
  }
`;

const LabelWrapper = styled.span`
  display: flex;

  @media (min-width: ${size.laptop}) {
    gap: 5px;
  }
`;

const MapKey = ({
  selectedDataset,
  tempUnit,
  stops,
  binHexColors,
  setTempUnit,
  children,
  useTabletViewOnLaptop = false,
  mapKeyText,
  datasetDescriptionResponse,
  activeClimateZoneLayers,
  precipitationUnit,
  activateClimateZoneLayer,
  setPrecipitationUnit,
}: PropsWithChildren<Props>) => {
  const isTablet = useMediaQuery({
    query: `(max-width: ${size.tabletMax})`,
  });
  const datasetUnitLongNames = mapKeyText?.datasetUnitLong || {};
  const binLabels = mapKeyText?.binLabels || {};
  if (!selectedDataset) {
    return null;
  }
  if (selectedDataset.dataset.unit === "class" && datasetDescriptionResponse) {
    return (
      <ClimateZonesKey
        selectedDataset={selectedDataset}
        binHexColors={binHexColors}
        datasetDescriptionResponse={datasetDescriptionResponse}
        activateClimateZoneLayer={activateClimateZoneLayer}
        activeClimateZoneLayers={activeClimateZoneLayers}
      />
    );
  }
  const { dataset, isDiff } = selectedDataset;
  const selectedStops = stops ? stops : selectedDataset.stops;
  const selectedBinHexColors = binHexColors ? binHexColors : selectedDataset.binHexColors;
  const datasetUnit =
    datasetUnitLongNames[camelcase(dataset.pfDatasetUnitByUnit.unitLong)] ||
    dataset.pfDatasetUnitByUnit.unitLong;
  const isTempMap = datasetUnit.toLowerCase().includes("temp");
  const isFrequent = selectedDataset.dataset.unit === "x as frequent";
  const isPrecipitationMap = selectedDataset.dataset.unit === "mm";

  const onTempUnitChange = () => setTempUnit(tempUnit === "°C" ? "°F" : "°C");

  const onPrecipitationUnitChange = () =>
    setPrecipitationUnit(precipitationUnit === "mm" ? "in" : "mm");

  const renderBin = (index: number, from: string, to?: string) => {
    if (selectedDataset.binLabels) {
      return (
        <span>
          {binLabels[camelcase(selectedDataset.binLabels[index])] ||
            selectedDataset.binLabels[index]}
        </span>
      );
    }
    if (to !== undefined) {
      return (
        <LabelWrapper>
          {from}
          <span className="dash">&ndash;</span>
          {to}
        </LabelWrapper>
      );
    }
    return <span>{from}</span>;
  };

  const renderSwitch = () => {
    if (isTempMap) {
      return (
        <Switch isChecked={tempUnit === "°F"} left="°C" right="°F" onChange={onTempUnitChange} />
      );
    } else if (isPrecipitationMap) {
      return (
        <Switch
          isChecked={precipitationUnit === "in"}
          left="mm"
          right="in"
          onChange={onPrecipitationUnitChange}
        />
      );
    }
    return null;
  };

  return (
    <Container className="map-key-container">
      <Content>
        <Header className="map-key-header">
          <Label className="map-key-label">
            {isTempMap
              ? datasetUnit.replace("°C", tempUnit)
              : isPrecipitationMap
              ? datasetUnit.replace("mm", precipitationUnit)
              : datasetUnit}
          </Label>
          {!isTablet && !useTabletViewOnLaptop && renderSwitch()}
        </Header>
        <Row>
          <BinsContainer className="map-key-bins-container">
            {selectedBinHexColors.map((color: string, index: number) => {
              const [from, to] = getBinLabel(
                selectedStops,
                index,
                datasetUnit,
                dataset.minValue,
                dataset.maxValue,
                dataset.unit === "mm" && precipitationUnit === "in" ? 0.1 : selectedDataset.step,
                tempUnit,
                isDiff,
                isFrequent,
                precipitationUnit,
                isPrecipitationMap,
              );
              return (
                <BinContainer key={`color_${index}`} className="map-key-bin-container">
                  <Color value={color} />
                  <Bin className="map-key-bin">{renderBin(index, from, to)}</Bin>
                </BinContainer>
              );
            })}
          </BinsContainer>
          {(isTablet || useTabletViewOnLaptop) && renderSwitch()}
        </Row>
        {children}
      </Content>
    </Container>
  );
};

export default MapKey;
