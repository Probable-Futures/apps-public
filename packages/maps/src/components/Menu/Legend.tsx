import React, { useState, useEffect, useMemo } from "react";
import styled, { css } from "styled-components";
import { components, contexts } from "@probable-futures/components-lib";
import { utils } from "@probable-futures/lib";

import { Container, SIDEBAR_GUTTER, Title } from "./Menu.styled";
import InputColor, { Color } from "react-input-color";
import { useMenu } from "../../components/Menu";
import { colors } from "../../consts";
import { getDiffMapBinHexColors } from "../../consts/versionDiffMaps";
import Collapsible from "../../components/common/Collapsible";
import useActiveDiffMap from "../../utils/useActiveDiffMap";
import { useTranslation } from "../../contexts/TranslationContext";

const MainContent = styled.div`
  padding: 14px ${SIDEBAR_GUTTER}px 0;
`;

const EditColorsContent = styled.div`
  background-color: #e7e7e7;
  padding: 12px ${SIDEBAR_GUTTER}px 21px;
`;

const ClearColorStyles = css`
  > span {
    width: 100%;
    height: 100%;
    border: none;
    padding: 0;
  }
`;

const ColorPicker = styled.div`
  width: 32px;
  height: 32px;
  border: 1px solid ${colors.lightGrey};
  margin-bottom: 4px;
  ${ClearColorStyles};
`;

// These are inline field labels and helper text, not section labels, so they opt
// back out of Title's uppercase micro-label treatment.
const Subtitle = styled(Title)`
  align-self: center;
  margin-left: 15px;
  margin-bottom: 0;
  color: ${colors.darkPurple};
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
`;

const InputLabel = styled(Subtitle)`
  margin-left: 10px;
`;

const Paragraph = styled(Subtitle)`
  align-self: flex-start;
  margin-left: 0;
  font-size: 12px;
  margin-top: 8px;
  color: ${colors.lightGrey2};
`;

const ListItem = styled(Container)`
  margin-bottom: 8px;
  position: relative;
`;

export default function Legend(): JSX.Element | null {
  const {
    data: { selectedDataset },
    mapStyle: { dynamicStyleVariables, setDynamicStyleVariables, binsType, setBinsType },
  } = useMenu();
  const [startColor, setStartColor] = useState<Color>();
  const [endColor, setEndColor] = useState<Color>();
  const [mapBins, setMapBins] = useState(dynamicStyleVariables?.bins);
  const { translate } = useTranslation();
  const activeDiffMap = useActiveDiffMap();

  const editedDataset = useMemo(() => {
    if (!selectedDataset || !activeDiffMap) {
      return selectedDataset;
    }
    return {
      ...selectedDataset,
      stops: activeDiffMap.stops,
      binHexColors: getDiffMapBinHexColors(activeDiffMap),
    };
  }, [selectedDataset, activeDiffMap]);

  // Update bins on dataset change
  useEffect(() => {
    if (dynamicStyleVariables?.bins) {
      setMapBins(dynamicStyleVariables?.bins);
    }
  }, [dynamicStyleVariables?.bins]);

  /**
   * `InputColor` calls onChange on mount and again whenever its initialValue
   * changes, echoing back the colour it was rendered with. Those echoes are not
   * edits: applying one overwrites whichever ramp is in state by the time it
   * arrives, which is what left the difference view painted with the plain map's
   * colours. A colour is only an edit when it differs from the rendered one.
   */
  const onPickBoundaryColor =
    (rendered: string, setColor: (color: Color) => void) => (color: Color) => {
      if (color.hex !== rendered) {
        setColor(color);
      }
    };

  useEffect(() => {
    if (!startColor || !endColor) {
      return;
    }
    setDynamicStyleVariables((previous) => ({
      ...previous,
      binHexColors: utils.interpolateColors(startColor, endColor),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startColor, endColor]);

  const updateColorScheme = (currentScheme: string[], color: Color, index: number) => {
    if (currentScheme[index] === color.hex) {
      return;
    }
    setDynamicStyleVariables((previous) => {
      const scheme = previous?.binHexColors ?? currentScheme;
      if (scheme[index] === color.hex) {
        return previous;
      }
      const newColorScheme = [...scheme];
      newColorScheme[index] = color.hex;
      return { ...previous, binHexColors: newColorScheme };
    });
  };

  const resetLegend = () => {
    setDynamicStyleVariables((previous) => ({
      ...previous,
      bins: editedDataset?.stops,
      binHexColors: editedDataset?.binHexColors,
    }));
  };

  const updateBins = (e: any) => {
    if (selectedDataset) {
      const max = selectedDataset.dataset.maxValue;
      let incrementValue = 0;
      let incrementFunction = (x: number) => x;
      if (e.currentTarget.value === translate("menu.legend.bins.doubling")) {
        incrementValue = Math.trunc(0.025 * max);
        incrementFunction = (x: number) => x * 2;
      } else {
        incrementValue = Math.round(max / (selectedDataset.stops.length + 1));
      }
      const newBins = generateNewBins(
        selectedDataset.stops,
        incrementValue,
        incrementFunction,
        selectedDataset.dataset.maxValue,
      );
      setDynamicStyleVariables((previous) => ({ ...previous, bins: newBins }));

      setMapBins(newBins);
      setBinsType(e.currentTarget.value);
    }
  };

  const generateNewBins = (
    initialBins: number[],
    incrementValue: number,
    incrementFunction: (x: number) => number,
    maxValue: number,
  ) => {
    let previousValue = 0;
    const newBins: number[] = [];
    initialBins.forEach((_) => {
      const value = incrementValue + previousValue;
      newBins.push(value > maxValue ? maxValue : value);
      previousValue = value;
      incrementValue = incrementFunction(incrementValue);
    });
    return newBins;
  };

  if (!dynamicStyleVariables?.binHexColors || !dynamicStyleVariables.bins) {
    return null;
  }

  const onCommitChange = (bins: any) =>
    setDynamicStyleVariables((previous) => ({ ...previous, bins }));

  return (
    <Container>
      <MainContent>
        <Title>{translate("menu.legend.bins.editBins")}</Title>
        <contexts.ThemeProvider theme="light">
          <components.Binning
            mapBins={mapBins}
            bins={editedDataset?.stops}
            binHexColors={dynamicStyleVariables.binHexColors}
            selectedDataset={editedDataset}
            isPro={false}
            updateColorScheme={updateColorScheme}
            onCommitChange={onCommitChange}
            setMapbins={setMapBins}
            binningText={translate("binning")}
            resetColorScheme={resetLegend}
          />
        </contexts.ThemeProvider>
        {!selectedDataset?.isDiff && !activeDiffMap && (
          <>
            <br />
            <ListItem flexDirection="row">
              <components.InputRadio
                type="radio"
                name="bins"
                value={translate("menu.legend.bins.incremental")}
                onChange={updateBins}
                checked={binsType === translate("menu.legend.bins.incremental")}
              />
              <InputLabel>{translate("menu.legend.bins.incremental")}</InputLabel>
            </ListItem>
            <ListItem flexDirection="row">
              <components.InputRadio
                type="radio"
                name="bins"
                value={translate("menu.legend.bins.doubling")}
                onChange={updateBins}
                checked={binsType === translate("menu.legend.bins.doubling")}
              />
              <InputLabel>{translate("menu.legend.bins.doubling")}</InputLabel>
            </ListItem>
          </>
        )}
      </MainContent>
      <br />
      <Collapsible header={translate("menu.legend.colors.editColors")}>
        <EditColorsContent>
          <Container flexDirection="row">
            <ColorPicker>
              <InputColor
                initialValue={dynamicStyleVariables.binHexColors[0]}
                onChange={onPickBoundaryColor(
                  dynamicStyleVariables.binHexColors[0],
                  setStartColor,
                )}
              />
            </ColorPicker>
            <Subtitle>{translate("menu.legend.colors.firstColor")}</Subtitle>
          </Container>
          <Container flexDirection="row">
            <ColorPicker>
              <InputColor
                initialValue={
                  dynamicStyleVariables.binHexColors[dynamicStyleVariables.binHexColors.length - 1]
                }
                onChange={onPickBoundaryColor(
                  dynamicStyleVariables.binHexColors[dynamicStyleVariables.binHexColors.length - 1],
                  setEndColor,
                )}
              />
            </ColorPicker>
            <Subtitle>{translate("menu.legend.colors.lastColor")}</Subtitle>
          </Container>
          <Paragraph>{translate("menu.legend.colors.colorHint")}</Paragraph>
        </EditColorsContent>
      </Collapsible>
    </Container>
  );
}
