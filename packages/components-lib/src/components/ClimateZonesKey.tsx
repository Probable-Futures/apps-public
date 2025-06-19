import { PropsWithChildren, ReactElement, useState } from "react";
import styled from "styled-components";
import { Popover, ArrowContainer, PopoverAlign, PopoverPosition } from "react-tiny-popover";
import { useMediaQuery } from "react-responsive";

import { DatasetDescriptionResponse, Map, consts, colors, size } from "@probable-futures/lib";
import { ReactComponent as CloseIcon } from "../assets/icons/close.svg";
import { purpleFilter } from "../styles/commonStyles";

type Props = {
  selectedDataset?: Map;
  binHexColors?: string[];
  datasetDescriptionResponse: DatasetDescriptionResponse;
  activateClimateZoneLayer?: (value: string[]) => void;
  activeClimateZoneLayers?: string[];
};

type ColorProps = {
  value: string;
  active: boolean;
};

const Container = styled.div`
  background-color: ${consts.colors.white};
  border: 1px solid ${consts.colors.grey};
  border-radius: 6px;
  display: flex;
  align-items: center;
`;

const BinContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 15px;
  position: relative;
  margin-top: 2px;

  @media (min-width: ${size.laptop}) {
    margin-top: 0px;
    gap: 20px;
  }

  &:not(:last-child):after {
    content: "";
    display: block;
    position: absolute;
    top: 20px;
    right: -21px;
    bottom: 0;
    width: 1px;
    background-color: ${consts.colors.secondaryGray};
    height: 22px;

    @media (min-width: ${size.laptop}) {
      height: 32px;
    }
  }
`;

const BinsContainer = styled.div`
  display: grid;
  grid-template-columns: auto auto auto auto auto auto;
  margin-bottom: 10px;
  grid-column-gap: 40px;
  margin-right: -20px;
`;

const Color = styled.div`
  height: 10.5px;
  width: 10.5px;
  aspect-ratio: 1/1;
  transition: transform 0.2s ease-out;
  cursor: pointer;
  transform-origin: center;
  transform: scale(1.01);
  object-fit: fill;

  background-color: ${({ value }: ColorProps) => value};
  ${({ active }: ColorProps) =>
    active && `transform: scale(1.4); box-shadow: 0 3px 5px 0 rgba(56, 22, 63, 0.23);`}
`;

const ColorBinWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const GroupName = styled.a`
  font-size: 12px;
  line-height: 11px;
  font-family: LinearSans;
  cursor: pointer;
  color: ${colors.dimBlack};
  width: fit-content;

  ${({ active }: { active: boolean }) => active && `color: ${colors.purple};`};
`;

const TooltipContent = styled.div`
  text-align: center;
  display: flex;
  align-items: center;
`;

const TooltipContentWrapper = styled.div`
  display: flex;
  gap: 10px;
  cursor: pointer;
  color: ${colors.black};
  background-color: ${colors.white};
  padding: 10px;
  border: 1px solid ${colors.grey};
  border-radius: 6px;
  font-size: 13px;
  letter-spacing: 0;
  line-height: 18px;
  max-width: 200px;
  box-sizing: content-box;
  align-items: flex-start;
  pointer-events: auto;
  box-shadow: rgba(56, 22, 63, 0.23) 0px 3px 5px 0px;
`;

const StyledCloseIconWrapper = styled.div`
  cursor: pointer;
  text-align: center;
  display: flex;
  align-items: center;
  width: 16px;
  height: 16px;

  &:hover {
    ${purpleFilter}
  }
`;

type TooltipProps = {
  show: boolean;
  tooltipContent: string;
  align: PopoverAlign;
  positions: PopoverPosition[];
  tooltipWhiteArrowStyles: React.CSSProperties;
  tooltipBlackArrowStyles: React.CSSProperties;
  onClose: () => void;
};

const ZoneTooltip = ({
  tooltipContent,
  show,
  children,
  align,
  positions,
  tooltipWhiteArrowStyles,
  tooltipBlackArrowStyles,
  onClose,
}: PropsWithChildren<TooltipProps>) => (
  <Popover
    isOpen={show}
    positions={positions}
    containerStyle={{
      zIndex: "4",
      pointerEvents: "none",
    }}
    align={align}
    content={({ position, childRect, popoverRect }) => (
      <ArrowContainer
        position={position}
        childRect={childRect}
        popoverRect={popoverRect}
        arrowColor={colors.grey}
        arrowSize={10}
        arrowStyle={tooltipBlackArrowStyles}
      >
        <ArrowContainer
          position={position}
          childRect={childRect}
          popoverRect={popoverRect}
          arrowColor={colors.white}
          arrowSize={10}
          style={{ padding: 0 }}
          arrowStyle={tooltipWhiteArrowStyles}
        >
          <TooltipContentWrapper>
            <TooltipContent>{tooltipContent}</TooltipContent>
            <StyledCloseIconWrapper onClick={onClose}>
              <CloseIcon />
            </StyledCloseIconWrapper>
          </TooltipContentWrapper>
        </ArrowContainer>
      </ArrowContainer>
    )}
  >
    {children as ReactElement}
  </Popover>
);

const ClimateZonesKey = ({
  selectedDataset,
  binHexColors,
  datasetDescriptionResponse,
  activateClimateZoneLayer,
  activeClimateZoneLayers,
}: Props) => {
  const [activeZone, setActiveZone] = useState<string | string[]>();
  const [activeClimateZoneLayersCpy, setActiveClimateZoneLayersCpy] = useState<
    string[] | undefined
  >(activeClimateZoneLayers);

  const isTablet = useMediaQuery({
    query: `(max-width: ${size.tabletMax})`,
  });

  if (!selectedDataset) {
    return null;
  }

  const selectedBinHexColors = binHexColors ? binHexColors : selectedDataset.binHexColors;

  const closeTooltip = () => {
    activateClimateZoneLayer?.([]);
    setActiveClimateZoneLayersCpy([]);
    setActiveZone(undefined);
  };

  const onClimateZoneClick = (values: string | string[]) => {
    if (activeZone?.toString() === values.toString()) {
      closeTooltip();
    } else {
      activateClimateZoneLayer?.(Array.isArray(values) ? values : [values]);
      setActiveClimateZoneLayersCpy(Array.isArray(values) ? values : [values]);
      setActiveZone(values);
    }
  };

  const tooltipPositions: PopoverPosition[] = isTablet ? ["bottom"] : ["top"];
  const tooltipWhiteArrowStyles = isTablet
    ? {
        borderLeft: "10px solid transparent",
        borderRight: "10px solid transparent",
        borderBottom: `10px solid ${colors.white}`,
        top: 2,
      }
    : {
        bottom: 2,
        borderTop: `10px solid ${colors.white}`,
        zIndex: 1,
      };

  const tooltipBlackArrowStyles = isTablet
    ? {
        top: 1,
      }
    : { bottom: 1 };

  const renderBins = () => {
    let index = 0;
    return datasetDescriptionResponse?.climate_zones?.map((group) => (
      <BinContainer key={group.name} className="climate-zones-bin-container">
        <ZoneTooltip
          tooltipContent={group.name}
          onClose={closeTooltip}
          show={
            !!activeClimateZoneLayersCpy &&
            activeClimateZoneLayersCpy.length > 1 &&
            !!activeClimateZoneLayersCpy.find((acz) => acz === group.list[0].value)
          }
          align="center"
          positions={tooltipPositions}
          tooltipWhiteArrowStyles={tooltipWhiteArrowStyles}
          tooltipBlackArrowStyles={tooltipBlackArrowStyles}
        >
          <GroupName
            onMouseOver={() => {
              if (!activeZone && !isTablet) {
                activateClimateZoneLayer?.(group.list.map((climateZone) => climateZone.value));
                setActiveClimateZoneLayersCpy(group.list.map((climateZone) => climateZone.value));
              }
            }}
            onMouseOut={() => {
              if (!activeZone && !isTablet) {
                activateClimateZoneLayer?.([]);
                setActiveClimateZoneLayersCpy([]);
              }
            }}
            onClick={() => onClimateZoneClick(group.list.map((climateZone) => climateZone.value))}
            active={
              !!activeClimateZoneLayersCpy &&
              activeClimateZoneLayersCpy.length > 1 &&
              !!activeClimateZoneLayersCpy.find((acz) => acz === group.list[0].value)
            }
          >
            {group.name}
          </GroupName>
        </ZoneTooltip>
        <ColorBinWrapper>
          {group.list?.map((climateZone) => {
            const color = selectedBinHexColors[index++];
            return (
              <ZoneTooltip
                tooltipContent={climateZone.name}
                show={
                  !!activeClimateZoneLayersCpy &&
                  activeClimateZoneLayersCpy.length === 1 &&
                  activeClimateZoneLayersCpy[0] === climateZone.value
                }
                onClose={closeTooltip}
                key={climateZone.symbol}
                align="center"
                positions={tooltipPositions}
                tooltipWhiteArrowStyles={tooltipWhiteArrowStyles}
                tooltipBlackArrowStyles={tooltipBlackArrowStyles}
              >
                <Color
                  value={color}
                  title={climateZone.name}
                  onMouseEnter={() => {
                    if (!activeZone && !isTablet) {
                      activateClimateZoneLayer?.([climateZone.value]);
                      setActiveClimateZoneLayersCpy([climateZone.value]);
                    }
                  }}
                  onMouseLeave={() => {
                    if (!activeZone && !isTablet) {
                      activateClimateZoneLayer?.([]);
                      setActiveClimateZoneLayersCpy([]);
                    }
                  }}
                  onClick={() => onClimateZoneClick(climateZone.value)}
                  active={
                    !!activeClimateZoneLayersCpy &&
                    activeClimateZoneLayersCpy.length === 1 &&
                    activeClimateZoneLayersCpy[0] === climateZone.value
                  }
                />
              </ZoneTooltip>
            );
          })}
        </ColorBinWrapper>
      </BinContainer>
    ));
  };

  return (
    <Container className="climate-zones-key-container">
      <BinsContainer>{renderBins()}</BinsContainer>
    </Container>
  );
};

export default ClimateZonesKey;
