import { memo, useMemo, useState } from "react";
import styled, { css } from "styled-components";
import Tippy from "@tippyjs/react/headless";
import WebMercatorViewport from "viewport-mercator-project";

import { colors } from "../../consts";
import { ReactComponent as CloseIcon } from "@probable-futures/components-lib/src/assets/icons/cancel-circle.svg";
import ArrowDown from "../../assets/icons/map/arrow-down.svg";
import {
  consts,
  utils,
  types,
  DatasetDescriptionResponse,
  getClimateZoneByValue,
} from "@probable-futures/lib";

type Props = {
  feature: types.PopupFeature;
  dataset?: types.Map;
  degreesOfWarming: number;
  mapState: any;
  tempUnit?: string;
  datasetDescriptionResponse: DatasetDescriptionResponse;
  precipitationUnit?: types.PrecipitationUnit;
  onClose: () => void;
  onReadMoreClick?: () => void;
  onBaselineClick?: () => void;
};

type ExpandedProps = {
  expanded: boolean;
  defaultDirection?: string;
};

const MAX_WIDTH = 500;
const MAX_HEIGHT = 600;

const StyledMapPopover = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${MAX_WIDTH}px;
  max-height: ${MAX_HEIGHT}px;
  padding: 14px;
  padding-bottom: 0px;
  background-color: ${colors.white};
  color: ${colors.secondaryBlack};
  box-sizing: border-box;
  border: 1px solid ${colors.grey};
  border-radius: 6px;
  box-shadow: 0 3px 5px 0 rgba(56, 22, 63, 0.23);
  overflow-x: hidden;

  &::before {
    content: "";
    width: 14px;
    height: 14px;
    position: absolute;
    transform: rotate(45deg);
    background-color: ${colors.grey};
    top: -7px;
    right: calc(50% - 8px);
    pointer-events: none;
  }

  &::after {
    content: "";
    width: 14px;
    height: 14px;
    position: absolute;
    transform: rotate(45deg);
    background-color: ${colors.white};
    top: -6px;
    right: calc(50% - 8px);
    z-index: 1;
    pointer-events: none;
  }
`;

const textStyles = css`
  color: ${colors.black};
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0;
`;

const Title = styled.span`
  display: flex;
  align-items: center;
  width: 100%;
  color: ${colors.secondaryBlack};
  font-size: 12px;
  font-weight: 600;
  line-height: 14px;
  margin-right: 25px;
`;

const ValueContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30px;
`;

const NoDataText = styled.span`
  display: block;
  ${textStyles};
  text-align: center;
  margin-top: 10px;
  margin-bottom: 20px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 18px;

  ${ValueContainer}:last-child {
    margin-right: 0;
  }
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

const Label = styled.span`
  display: block;
  max-width: 80px;
  color: ${colors.black};
  font-size: 10px;
  letter-spacing: 0;
  line-height: 10px;
  text-align: center;
  text-transform: capitalize;
  box-sizing: border-box;
  padding: 0px 4px;
`;

const StyledCloseIcon = styled(CloseIcon)`
  margin-left: auto;
  cursor: pointer;
`;

const DetailsContainer = styled.div`
  background-color: ${colors.lightCream};
  border-top: 1px solid ${colors.secondaryBlack};
  margin-left: -16px;
  margin-right: -16px;
`;

const ToggleDetailsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 3px 0;
  background: transparent;
  border: 0;
  text-transform: uppercase;
  font-family: "RelativeMono";
  color: ${colors.darkPurple};
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

const MeanFrequencyText = styled.span`
  display: block;
  ${textStyles};
  font-size: 20px;
`;

const Description = styled.p`
  font-weight: 400;
  font-size: 10px;
  max-width: 209px;
  padding: 4px 0px;
  line-height: 20px;
  margin: 0;
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

// https://github.com/keplergl/kepler.gl/blob/master/src/components/map/map-popover.js
const createVirtualReference = (container: any, x = 0, y = 0, size = 0) => {
  const bounds =
    container && container.getBoundingClientRect ? container.getBoundingClientRect() : {};
  const left = (bounds.left || 0) + x - size / 2;
  const top = (bounds.top || 0) + y - size / 2;
  return {
    left,
    top,
    right: left + size,
    bottom: top + size,
    width: size,
    height: size,
  };
};

const getCoordinate = (viewport: WebMercatorViewport, lngLat: number[]) => {
  const screenCoord = !viewport || !lngLat ? null : viewport.project(lngLat);
  return screenCoord && { x: screenCoord[0], y: screenCoord[1] };
};

const FeaturePopup = ({
  feature,
  dataset,
  degreesOfWarming,
  mapState,
  tempUnit,
  datasetDescriptionResponse,
  precipitationUnit,
  onClose,
  onReadMoreClick,
  onBaselineClick,
}: Props) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showLearnWhy, setShowLearnWhy] = useState(false);

  const container = document.body;
  const {
    latitude,
    longitude,
    selectedData,
    data_baseline_low: baselineLow,
    data_baseline_mid: baselineMid,
    data_baseline_high: baselineHigh,
  } = feature;
  const isFrequent = dataset?.dataset.unit === "x as frequent";
  const showBaselineDetails = !!dataset?.isDiff && !isFrequent;
  const isTemp = dataset?.dataset.pfDatasetUnitByUnit.unitLong.toLowerCase().includes("temp");
  const showInF = isTemp && tempUnit === "°F";
  const isPrecipitationMap = dataset?.dataset.unit === "mm";
  const showInInch = isPrecipitationMap && precipitationUnit === "in";

  const isMidValid =
    selectedData.mid !== undefined &&
    selectedData.mid !== consts.ERROR_VALUE &&
    selectedData.mid !== consts.BARREN_LAND_VALUE;

  const coordinate = useMemo(() => {
    const viewport = new WebMercatorViewport(mapState);

    return getCoordinate(viewport, [longitude, latitude]);
  }, [latitude, longitude, mapState]);

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
      lowValue = utils.convertmmToin(low) as number;
      highValue = utils.convertmmToin(high) as number;
      meanValue = utils.convertmmToin(mid) as number;
    }
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
        return utils.getLabelByValue(
          value as number,
          dataset.binningType,
          dataset.binLabels,
          dataset.stops,
        );
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
            <Label>{dataset?.dataLabels[0]}</Label>
          </ValueContainer>
        )}
        {meanValue !== undefined && (
          <ValueContainer>
            {isFrequent && meanValue < 1 ? (
              <MeanFrequencyText>Less frequent</MeanFrequencyText>
            ) : (
              <AvgValue fontSize={dataset?.binLabels ? 24 : 40}>
                {getValue(meanValue, getMidValue)}
              </AvgValue>
            )}
            {(!dataset?.isDiff || lowValue !== undefined || highValue !== undefined) && (
              <Label>{dataset?.dataLabels[1]}</Label>
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
            <Label>{dataset?.dataLabels[2]}</Label>
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
      return "Expected outcome" + unit;
    }
    return "Expected range of outcomes" + unit;
  };

  const renderDescription = () => {
    if (dataset?.dataset.unit !== "class" || !dataset.binLabels || !isMidValid) {
      return "";
    }
    return (
      getClimateZoneByValue(datasetDescriptionResponse, selectedData.mid as number)?.description ||
      ""
    );
  };

  const renderNoDataDescription = () => {
    if (selectedData.mid === consts.ERROR_VALUE) {
      return (
        <DetailsContainer>
          <ToggleDetailsButton onClick={() => setShowLearnWhy(!showLearnWhy)}>
            learn why
            <ArrowIcon expanded={showLearnWhy} defaultDirection="bottom" />
          </ToggleDetailsButton>
          <DetailsContent expanded={showLearnWhy}>
            <ErrorDataDesc>
              Values are not shown here due to anomalies found in the model data.
            </ErrorDataDesc>
          </DetailsContent>
        </DetailsContainer>
      );
    } else if (selectedData.mid === consts.BARREN_LAND_VALUE) {
      return (
        <DetailsContainer>
          <ToggleDetailsButton onClick={() => setShowLearnWhy(!showLearnWhy)}>
            learn why
            <ArrowIcon expanded={showLearnWhy} defaultDirection="bottom" />
          </ToggleDetailsButton>
          <DetailsContent expanded={showLearnWhy}>
            <BarrenDataDesc>
              In these maps, places that are already consistently dry do not display data for
              dryness measures.
            </BarrenDataDesc>
            <ToggleDetailsButton onClick={onReadMoreClick}>
              read more
              <ArrowIcon expanded={false} defaultDirection="right" />
            </ToggleDetailsButton>
          </DetailsContent>
        </DetailsContainer>
      );
    }
  };

  const baselineTitle = () => {
    if (showDetails) {
      return degreesOfWarming === 0.5 ? "Hide past range" : "Hide baseline details";
    } else {
      return degreesOfWarming === 0.5 ? "Show past range" : "Show baseline details";
    }
  };

  return (
    <Tippy
      zIndex={0}
      visible
      interactive
      ignoreAttributes
      // @ts-ignore
      getReferenceClientRect={() => createVirtualReference(container, coordinate?.x, coordinate?.y)}
      placement="bottom"
      offset={[0, 10]} /* move popup 10px down(10=size of the arrow)*/
      appendTo={container}
      popperOptions={{
        placement: "bottom",
        modifiers: [
          { name: "preventOverflow", enabled: false },
          { name: "flip", enabled: false },
        ],
      }}
      render={(attrs) => (
        <StyledMapPopover {...attrs}>
          {dataset && (
            <>
              <Title>
                {renderTitle()}
                <StyledCloseIcon onClick={onClose} />
              </Title>
              {dataset?.dataset.unit === "class" && dataset.binLabels && isMidValid && (
                <Description dangerouslySetInnerHTML={{ __html: renderDescription() }} />
              )}
            </>
          )}
          {!isMidValid ? (
            <>
              <NoDataText>No data here</NoDataText>
              {renderNoDataDescription()}
            </>
          ) : (
            <>
              {renderValues(
                showBaselineDetails,
                selectedData.low,
                selectedData.mid,
                selectedData.high,
              )}
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
                    read more
                    <ArrowIcon expanded={false} defaultDirection="right" />
                  </ToggleDetailsButton>
                </DetailsContainer>
              )}
              {!dataset?.isDiff && dataset?.name.toLowerCase().startsWith("change") && (
                <DetailsContainer>
                  <ToggleDetailsButton onClick={onBaselineClick}>
                    about the baseline
                    <ArrowIcon expanded={false} defaultDirection="right" />
                  </ToggleDetailsButton>
                </DetailsContainer>
              )}
            </>
          )}
        </StyledMapPopover>
      )}
    />
  );
};

export default memo(FeaturePopup);
