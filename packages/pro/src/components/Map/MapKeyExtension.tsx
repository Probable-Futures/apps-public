import { useEffect, useState } from "react";
import styled from "styled-components";
import { Collapse } from "@mui/material";
import { VisualChannelDomain } from "@kepler.gl/types";

import { useMapData } from "../../contexts/DataContext";
import { colors } from "../../consts";
import ArrowDownIcon from "../../assets/icons/map/arrow-down.svg";
import { StyledDivider } from "../Common";
import { useAppSelector } from "../../app/hooks";
import { MAP_ID } from "../../consts/MapConsts";

const Container = styled.div`
  background-color: ${colors.white};
  border: 1px solid ${colors.grey};
  border-radius: 6px;
`;

const ColorsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  max-width: 40vw;
  max-height: 200px;
  overflow: auto;
`;
const ColorNameContainer = styled.div`
  display: flex;
  gap: 10px;
  flex: 50%;
  margin-bottom: 7.5px;
`;
const Color = styled.div`
  height: 13.69px;
  flex: 0 0 48px;
  background-color: ${({ value }: { value: string }) => value};
`;
const ColorValue = styled.div`
  color: ${colors.darkPurple};
  font-family: RelativeMono;
  font-size: 13px;
  letter-spacing: 0;
  line-height: 16px;
`;
const ColorTitle = styled.div`
  color: ${colors.secondaryBlack};
  font-family: LinearSans;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.83px;
  line-height: 11px;
  user-select: none;
  text-transform: uppercase;
  word-break: break-all;
`;
const ColorTitleWrapper = styled.div`
  align-items: center;
  display: flex;
  gap: 10px;
  cursor: pointer;
  margin-bottom: 10px;
`;

const RadiusTitleContainer = styled.div`
  padding: 11px 18px;
`;

const StyledArrowDownIcon = styled.i`
  background-image: url(${ArrowDownIcon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 12px;
  height: 12px;
  transform: ${({ isOpen }: { isOpen: boolean }) => (isOpen ? "rotate(0deg);" : "rotate(-90deg);")};
`;

const PointColorWrapper = styled.div`
  padding: 12px 18px 0px 18px;
`;

const MapKeyExtension = () => {
  const { selectedClimateData } = useMapData();
  const [showColors, setShowColors] = useState(true);
  const [filteredColorDomains, setFilteredColorDomains] = useState<VisualChannelDomain>([]);
  const layers = useAppSelector((state) => state.keplerGl[MAP_ID]?.visState?.layers);
  const filters = useAppSelector((state) => state.keplerGl[MAP_ID]?.visState?.filters);
  const pointLayer = layers?.find((layer: any) => layer.type === "point");

  useEffect(() => {
    const setKeyColors = () => {
      let res = pointLayer?.config?.colorDomain || [];
      if (filters && filters.length > 0 && pointLayer?.config) {
        const currentColorFilter = filters.find((filter: any) =>
          filter.name.includes(pointLayer.config.colorField?.name),
        );
        if (currentColorFilter) {
          const filteredColors = res.filter((color: string | number) => {
            if (currentColorFilter.type === "range" && currentColorFilter.domain) {
              return color > currentColorFilter.domain[0] && color < currentColorFilter.domain[1];
            }
            return currentColorFilter.value.includes(color);
          });
          res = filteredColors as VisualChannelDomain;
        }
      }
      setFilteredColorDomains(res);
    };
    setKeyColors();
  }, [filters, pointLayer?.config, pointLayer?.config?.colorField?.name]);

  if (
    !selectedClimateData ||
    !pointLayer ||
    (!pointLayer.config.colorField && !pointLayer.config.sizeField)
  ) {
    return null;
  }

  const toggleShowColors = () => setShowColors((val) => !val);

  const renderColorValueMapping = () => {
    if (!pointLayer?.config?.colorField || !pointLayer?.config?.visConfig) {
      return null;
    }
    if (
      pointLayer.config.colorField.type === "real" ||
      pointLayer.config.colorField.type === "integer"
    ) {
      // filteredColorDomains contains all the values of the selected field. We devide by the number of colors so each color gets the same amout of data.
      const partition = Math.floor(
        filteredColorDomains.length / pointLayer.config.visConfig.colorRange.colors.length,
      );
      const ranges = pointLayer.config.visConfig.colorRange.colors.map(
        (_: string, index: number) => {
          return filteredColorDomains[index * partition];
        },
      );
      return (
        <ColorsContainer>
          {ranges.map((value: string, index: number) => (
            <ColorNameContainer key={`${value}_${index}`}>
              <Color value={pointLayer.config.visConfig.colorRange.colors[index]}></Color>
              {index === ranges.length - 1 ? (
                <ColorValue>
                  {value} - {filteredColorDomains[filteredColorDomains.length - 1]}
                </ColorValue>
              ) : (
                <ColorValue>
                  {value} - {ranges[index + 1]}
                </ColorValue>
              )}
            </ColorNameContainer>
          ))}
        </ColorsContainer>
      );
    } else {
      return (
        <ColorsContainer>
          {filteredColorDomains.slice(0, 200).map((value, index: number) => (
            <ColorNameContainer key={`${value}_${index}`}>
              <Color
                value={
                  pointLayer.config.visConfig.colorRange.colors[
                    (pointLayer.config.colorDomain || []).findIndex(
                      (colorDomain) => colorDomain === value,
                    ) % pointLayer.config.visConfig.colorRange.colors.length
                  ]
                }
              ></Color>
              <ColorValue>{value}</ColorValue>
            </ColorNameContainer>
          ))}
        </ColorsContainer>
      );
    }
  };

  return (
    <Container>
      {pointLayer && pointLayer.config.colorField && (
        <PointColorWrapper>
          <ColorTitleWrapper onClick={toggleShowColors}>
            <StyledArrowDownIcon isOpen={showColors} />
            <ColorTitle>
              Point: {pointLayer.config.colorField.displayName || pointLayer.config.colorField.name}
            </ColorTitle>
          </ColorTitleWrapper>

          <Collapse in={showColors}>{renderColorValueMapping()}</Collapse>
          {pointLayer.config.sizeField && <StyledDivider color={colors.darkPurple} />}
        </PointColorWrapper>
      )}
      {pointLayer && pointLayer.config.sizeField && (
        <RadiusTitleContainer>
          <ColorTitle>
            Radius Range:{" "}
            {pointLayer.config.sizeField.displayName || pointLayer.config.sizeField.name}
          </ColorTitle>
        </RadiusTitleContainer>
      )}
    </Container>
  );
};

export default MapKeyExtension;
