import { useState } from "react";
import styled, { css } from "styled-components";
import camelcase from "lodash.camelcase";

import {
  types,
  utils,
  consts,
  DatasetDescriptionResponse,
  getClimateZoneByValue,
} from "@probable-futures/lib";
import ArrowDown from "../assets/icons/arrow-down.svg";

type Props = {
  feature: types.PopupFeature;
  dataset?: types.Map;
  degreesOfWarming: number;
  tempUnit?: string;
  showInspector: boolean;
  datasetDescriptionResponse?: DatasetDescriptionResponse;
  mapPopoverText?: any;
  keyText?: any;
  onReadMoreClick?: () => void;
  onBaselineClick?: () => void;
  precipitationUnit?: types.PrecipitationUnit;
};

type ExpandedProps = {
  expanded: boolean;
  defaultDirection?: string;
};

const textStyles = css`
  color: ${consts.colors.black};
  font-weight: 600;
  letter-spacing: 0;
`;

const Title = styled.span`
  display: block;
  max-width: 210px;
  color: ${consts.colors.dimBlack};
  font-size: 12px;
  font-weight: 600;
  line-height: 14px;
  margin-right: 25px;

  &:first-letter {
    text-transform: uppercase;
  }
`;

const ValueContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  gap: 5px;
`;

const NoDataDescriptionStyles = css`
  text-align: center;
  font-family: LinearSans;
  font-size: 14px;
  max-width: 252px;
  box-sizing: content-box;
`;

const ErrorDataDesc = styled.div`
  padding: 5px 20px 20px;
  ${NoDataDescriptionStyles};
`;

const BarrenDataDesc = styled.div`
  padding: 5px 20px;
  ${NoDataDescriptionStyles};
`;

const NoDataText = styled.span`
  display: block;
  ${textStyles};
  text-align: center;
  margin-top: 10px;
  margin-bottom: 16px;
  font-size: 20px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
  padding-bottom: 18px;
  text-align: center;
  gap: 20px;
`;

const Value = styled.span`
  display: block;
  ${textStyles};
`;

const ValueWithNumber = styled(Value)`
  margin: 18px 0 4px;
  font-size: 20px;
`;

const ValueWithLabel = styled(Value)`
  margin: 10px 0 4px;
  font-size: 14px;
`;

const AvgValue = styled.span`
  display: block;
  ${textStyles};
  font-size: ${({ fontSize }: { fontSize?: number }) => fontSize}px;
`;

const MeanFrequencyText = styled.span`
  display: block;
  ${textStyles};
  font-size: 20px;
`;

const Label = styled.span`
  display: block;
  max-width: 80px;
  color: ${consts.colors.black};
  font-size: 10px;
  letter-spacing: 0;
  line-height: 10px;
  text-align: center;
  box-sizing: border-box;
  padding: 0px 4px;

  &:first-letter {
    text-transform: lowercase;
  }
`;

const DetailsContainer = styled.div`
  background-color: ${consts.colors.lightCream};
  border-top: 1px solid ${consts.colors.dimBlack};
  margin: 0 -16px;
`;

const ToggleDetailsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 3px 20px;
  background: transparent;
  border: 0;
  text-transform: uppercase;
  font-family: "RelativeMono";
  color: ${consts.colors.textBlack};
  font-size: 10px;
  letter-spacing: 0;
  line-height: 29px;
  cursor: pointer;
`;

const ArrowIcon = styled.i`
  background-image: url(${ArrowDown});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 6px;
  height: 9px;
  display: inline-block;
  margin-left: 9px;
  transition: transform 0.3s ease;
  transform: ${({ expanded, defaultDirection }: ExpandedProps) =>
    expanded ? "rotate(180deg)" : defaultDirection === "right" ? "rotate(-90deg)" : "rotate(0)"};
`;

const DetailsContent = styled.div`
  opacity: ${({ expanded }: ExpandedProps) => (expanded ? "1" : "0")};
  max-height: ${({ expanded }: ExpandedProps) => (expanded ? "100px" : "0")};
  transition: max-height 0.3s ease, opacity 0.3s ease;
  overflow: ${({ expanded }: ExpandedProps) => (expanded ? "initial" : "hidden")};
`;

const Inspector = styled.div`
  display: flex;
  align-items: center;
  font-size: 10px;
  font-style: italic;
  margin-bottom: 10px;
  margin-top: 2px;

  p {
    margin: 0;
  }
`;

const Description = styled.div`
  font-weight: 400;
  font-size: 10px;
  max-width: 209px;
  line-height: 14px;
  padding: 4px 0px;
`;

const PopupContent = ({
  feature,
  dataset,
  degreesOfWarming,
  tempUnit,
  showInspector,
  datasetDescriptionResponse,
  onReadMoreClick,
  onBaselineClick,
  precipitationUnit,
  mapPopoverText,
  keyText,
}: Props): JSX.Element => {
  const [showDetails, setShowDetails] = useState(degreesOfWarming === 0.5 ? true : false);
  const [showLearnWhy, setShowLearnWhy] = useState(false);

  const {
    selectedData,
    data_baseline_low: baselineLow,
    data_baseline_mid: baselineMid,
    data_baseline_high: baselineHigh,
  } = feature;
  const isTemp = dataset?.dataset.pfDatasetUnitByUnit.unitLong.toLowerCase().includes("temp");
  const showInF = isTemp && tempUnit === "°F";
  const isFrequent = dataset?.dataset.unit === "x as frequent";
  const isPrecipitationMap = dataset?.dataset.unit === "mm";
  const showInInch = isPrecipitationMap && precipitationUnit === "in";

  const showBaselineDetails = !!dataset?.isDiff && !isFrequent;

  const isMidValid =
    selectedData.mid !== undefined &&
    selectedData.mid !== consts.ERROR_VALUE &&
    selectedData.mid !== consts.BARREN_LAND_VALUE;

  const checkEdgeCaseForPrecipitationBinsAfterConvertingToInch = (value?: number) => {
    if (value === -51 || value === -26) {
      return (utils.convertmmToin(value) as number) - 0.1;
    }
    return utils.convertmmToin(value) as number;
  };

  const renderValues = (showPlusSign: boolean, low?: number, mid?: number, high?: number) => {
    if (dataset?.dataset.unit === "class") {
      return null;
    }
    let lowValue = low,
      highValue = high,
      meanValue = mid;
    if (showInF) {
      lowValue = utils.convertCToF(low) as number;
      highValue = utils.convertCToF(high) as number;
      meanValue = utils.convertCToF(mid) as number;
    } else if (showInInch) {
      lowValue = checkEdgeCaseForPrecipitationBinsAfterConvertingToInch(low);
      highValue = checkEdgeCaseForPrecipitationBinsAfterConvertingToInch(high);
      meanValue = checkEdgeCaseForPrecipitationBinsAfterConvertingToInch(mid);
    }
    const showMidValueLabel = !dataset?.isDiff || lowValue !== undefined || highValue !== undefined;

    const getMidValue = () => {
      if (meanValue === undefined) {
        return null;
      }
      let prefix = "",
        suffix = "";
      if (isFrequent && meanValue >= 1) {
        suffix = "x";
      } else if (
        dataset?.dataset.unit === "mm" &&
        consts.datasetsWithMidValuesOnly.includes(dataset.dataset.id)
      ) {
        suffix = ` ${precipitationUnit}`;
      } else if (dataset?.dataset.unit === "%") {
        suffix = "%";
      }
      if (showPlusSign && meanValue > 0) {
        prefix = "+";
      }

      return prefix + meanValue + suffix;
    };

    const getValue = (value: number, getter?: () => string | null) => {
      if (dataset?.binLabels) {
        const labelValue = utils.getLabelByValue(
          value as number,
          dataset.binningType,
          dataset.binLabels,
          dataset.stops,
        );
        if (labelValue) {
          return keyText?.binLabels[camelcase(labelValue)] || labelValue;
        }
        return labelValue;
      } else if (getter) {
        return getter();
      }
      return showPlusSign && value > 0 ? `+${value}` : value;
    };

    return (
      <RowContainer>
        {lowValue !== undefined && (
          <ValueContainer>
            {dataset?.binLabels ? (
              <ValueWithLabel>{getValue(lowValue)}</ValueWithLabel>
            ) : (
              <ValueWithNumber>{getValue(lowValue)}</ValueWithNumber>
            )}
            <Label>
              {mapPopoverText?.year[camelcase(dataset?.dataLabels[0])] || dataset?.dataLabels[0]}
            </Label>
          </ValueContainer>
        )}
        {meanValue !== undefined && (
          <ValueContainer>
            {isFrequent && meanValue < 1 ? (
              <MeanFrequencyText>
                {mapPopoverText?.lessFrequent || "Less frequent"}
              </MeanFrequencyText>
            ) : (
              <AvgValue fontSize={dataset?.binLabels ? 24 : 40}>
                {getValue(meanValue, getMidValue)}
              </AvgValue>
            )}
            {showMidValueLabel && (
              <Label>
                {mapPopoverText?.year[camelcase(dataset?.dataLabels[1])] || dataset?.dataLabels[1]}
              </Label>
            )}
          </ValueContainer>
        )}
        {highValue !== undefined && (
          <ValueContainer>
            {dataset?.binLabels ? (
              <ValueWithLabel>{getValue(highValue)}</ValueWithLabel>
            ) : (
              <ValueWithNumber>{getValue(highValue)}</ValueWithNumber>
            )}
            <Label>
              {mapPopoverText?.year[camelcase(dataset?.dataLabels[2])] || dataset?.dataLabels[2]}
            </Label>
          </ValueContainer>
        )}
      </RowContainer>
    );
  };

  const renderTitle = () => {
    if (!dataset) {
      return "";
    }
    if (
      dataset.dataset.unit === "class" &&
      dataset.binLabels &&
      isMidValid &&
      datasetDescriptionResponse
    ) {
      const climateZone = getClimateZoneByValue(
        datasetDescriptionResponse,
        selectedData.mid as number,
      );
      return climateZone?.name || "";
    }
    let unit = "";
    if (
      dataset.dataset.unit !== "z-score" &&
      !consts.datasetsWithMidValuesOnly.includes(dataset.dataset.id)
    ) {
      if (isPrecipitationMap) {
        unit = ` (${precipitationUnit}) `;
      } else if (isTemp) {
        unit = ` (${tempUnit}) `;
      } else {
        unit = ` (${dataset.dataset.unit}) `;
      }
    }

    if (consts.datasetsWithMidValuesOnly.includes(dataset.dataset.id)) {
      return (mapPopoverText?.expectedOutcome || "Expected outcome") + unit;
    }

    return (mapPopoverText?.expectedRangeOfOutcomes || "Expected range of outcomes") + unit;
  };

  const renderDescription = () => {
    if (dataset?.dataset.unit !== "class" || !dataset.binLabels || !isMidValid) {
      return "";
    }
    if (datasetDescriptionResponse) {
      return (
        getClimateZoneByValue(datasetDescriptionResponse, selectedData.mid as number)
          ?.description || ""
      );
    }
    return "";
  };

  const renderInspector = () => {
    if (showInspector) {
      return (
        <Inspector>
          <p>
            {keyText?.latitude || "Latitude"}: {Math.trunc(feature.latitude * 100) / 100} |{" "}
            {keyText?.longitude || "Longitude"}: {Math.trunc(feature.longitude * 100) / 100}
          </p>
        </Inspector>
      );
    }
    return null;
  };

  const renderNoDataDescription = () => {
    if (selectedData.mid === consts.ERROR_VALUE) {
      return (
        <DetailsContainer>
          <ToggleDetailsButton onClick={() => setShowLearnWhy(!showLearnWhy)}>
            {mapPopoverText?.learnWhy || "learn why"}
            <ArrowIcon expanded={showLearnWhy} defaultDirection="bottom" />
          </ToggleDetailsButton>
          <DetailsContent expanded={showLearnWhy}>
            <ErrorDataDesc>
              {mapPopoverText?.errorValueDescription ||
                "Values are not shown here due to anomalies found in the model data."}
            </ErrorDataDesc>
          </DetailsContent>
        </DetailsContainer>
      );
    } else if (selectedData.mid === consts.BARREN_LAND_VALUE) {
      return (
        <DetailsContainer>
          <ToggleDetailsButton onClick={() => setShowLearnWhy(!showLearnWhy)}>
            {mapPopoverText?.learnWhy || "learn why"}
            <ArrowIcon expanded={showLearnWhy} defaultDirection="bottom" />
          </ToggleDetailsButton>
          <DetailsContent expanded={showLearnWhy}>
            <BarrenDataDesc>
              {mapPopoverText?.barrenLandDescription ||
                "In these maps, places that are already consistently dry do not display data for dryness measures."}
            </BarrenDataDesc>
            <ToggleDetailsButton onClick={onReadMoreClick}>
              {mapPopoverText?.readMore || "read more"}
              <ArrowIcon expanded={false} defaultDirection="right" />
            </ToggleDetailsButton>
          </DetailsContent>
        </DetailsContainer>
      );
    }
  };

  const baselineTitle = () => {
    if (showDetails) {
      return mapPopoverText?.hideBaselineDetails || "Hide baseline details";
    } else {
      return mapPopoverText?.showBaselineDetails || "Show baseline details";
    }
  };

  return (
    <div>
      {dataset && (
        <>
          <Title>{renderTitle()}</Title>
          {dataset?.dataset.unit === "class" && (
            <Description dangerouslySetInnerHTML={{ __html: renderDescription() }} />
          )}
          {renderInspector()}
        </>
      )}
      {!isMidValid ? (
        <>
          <NoDataText>{mapPopoverText?.noData || "No data here"}</NoDataText>
          {renderNoDataDescription()}
        </>
      ) : (
        <>
          {renderValues(showBaselineDetails, selectedData.low, selectedData.mid, selectedData.high)}
          {showBaselineDetails && (
            <DetailsContainer>
              <ToggleDetailsButton onClick={() => setShowDetails(!showDetails)}>
                {baselineTitle()}
                <ArrowIcon expanded={showDetails} defaultDirection="bottom" />
              </ToggleDetailsButton>
              <DetailsContent expanded={showDetails}>
                {renderValues(false, baselineLow, baselineMid, baselineHigh)}
              </DetailsContent>
            </DetailsContainer>
          )}
          {dataset?.dataset.unit === "class" && (
            <DetailsContainer>
              <ToggleDetailsButton onClick={onReadMoreClick}>
                {mapPopoverText?.readMore || "read more"}
                <ArrowIcon expanded={false} defaultDirection="right" />
              </ToggleDetailsButton>
            </DetailsContainer>
          )}
          {!dataset?.isDiff && dataset?.name.toLowerCase().startsWith("change") && (
            <DetailsContainer>
              <ToggleDetailsButton onClick={onBaselineClick}>
                {mapPopoverText?.aboutTheBaseline || "about the baseline"}
                <ArrowIcon expanded={false} defaultDirection="right" />
              </ToggleDetailsButton>
            </DetailsContainer>
          )}
        </>
      )}
    </div>
  );
};

export default PopupContent;
