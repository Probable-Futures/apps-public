import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { components, contexts } from "@probable-futures/components-lib";
import { utils } from "@probable-futures/lib";

import { Container, Title } from "./Menu.styled";
import InputColor, { Color } from "react-input-color";
import { useMenu } from "../../components/Menu";
import { colors } from "../../consts";
import Collapsible from "../../components/common/Collapsible";
import { useTranslation } from "../../contexts/TranslationContext";

const MainContent = styled.div`
  padding: 15px 20px 0 52px;
`;

const EditColorsContent = styled.div`
  background-color: #e7e7e7;
  padding: 12px 40px 21px 74px;
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

const Subtitle = styled(Title)`
  align-self: center;
  margin-left: 15px;
  margin-bottom: 0;
`;

const InputLabel = styled(Subtitle)`
  margin-left: 10px;
`;

const Paragraph = styled(Title)`
  font-size: 12px;
  margin-top: 8px;
`;

const ListItem = styled(Container)`
  margin-bottom: 8px;
  position: relative;
`;

export default function Legend(): JSX.Element | null {
  const {
    data: { selectedDataset },
    mapStyle: { binHexColors, setColorScheme, bins, setBins, binsType, setBinsType },
  } = useMenu();
  const [startColor, setStartColor] = useState<Color>();
  const [endColor, setEndColor] = useState<Color>();
  const [mapBins, setMapBins] = useState(bins);
  const { translate } = useTranslation();

  // Update bins on dataset change
  useEffect(() => {
    if (bins) {
      setMapBins(bins);
    }
  }, [bins]);

  useEffect(() => {
    if (binHexColors && startColor && endColor) {
      if (
        startColor.hex !== binHexColors[0] ||
        endColor.hex !== binHexColors[binHexColors.length - 1]
      ) {
        setColorScheme(utils.interpolateColors(startColor, endColor));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startColor, endColor]);

  const updateColorScheme = (currentScheme: string[], color: Color, index: number) => {
    const newColorScheme = [...currentScheme];
    newColorScheme[index] = color.hex;
    setColorScheme(newColorScheme);
  };

  const resetColorScheme = () => {
    setColorScheme(selectedDataset?.binHexColors);
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
      setBins(newBins);
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

  if (!binHexColors || !bins) {
    return null;
  }

  const onCommitChange = (bins: any) => setBins(bins);

  return (
    <Container>
      <MainContent>
        <Title>{translate("menu.legend.bins.editBins")}</Title>
        <contexts.ThemeProvider theme="light">
          <components.Binning
            mapBins={mapBins}
            bins={selectedDataset?.stops}
            binHexColors={binHexColors}
            selectedDataset={selectedDataset}
            isPro={false}
            updateColorScheme={updateColorScheme}
            onCommitChange={onCommitChange}
            setMapbins={setMapBins}
            binningText={translate("binning")}
            resetColorScheme={resetColorScheme}
          />
        </contexts.ThemeProvider>
        {!selectedDataset?.isDiff && (
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
              <InputColor initialValue={binHexColors[0]} onChange={setStartColor} />
            </ColorPicker>
            <Subtitle>{translate("menu.legend.colors.firstColor")}</Subtitle>
          </Container>
          <Container flexDirection="row">
            <ColorPicker>
              <InputColor
                initialValue={binHexColors[binHexColors.length - 1]}
                onChange={setEndColor}
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
