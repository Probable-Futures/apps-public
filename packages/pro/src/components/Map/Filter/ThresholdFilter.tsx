import React, { memo } from "react";
import styled from "styled-components";
import { Slider } from "@mui/material";
import { Filter } from "@kepler.gl/types";

import { PanelContent, PanelHeaderTitle, StyledDivider } from "../../Common";
import Info from "../Info";
import ThresholdBinning from "./ThresholdBinning";
import { colors } from "../../../consts";

type Props = {
  filter: Filter;
  min: number;
  max: number;
  unit: string;
  onSliderValueChange: (value: number[]) => void;
};

const StyledSlider = styled(Slider)`
  width: 94%;
  margin-left: 6px;
  & .MuiSlider-track {
    color: ${colors.darkGrey} !important;
    height: 2px;
  }
  & .MuiSlider-mark {
    background-color: ${colors.darkGrey};
    height: 8px;
    width: 1px;
    margin-top: 0px;
  }
  & .MuiSlider-thumb {
    color: ${colors.primaryWhite} !important;
    height: 16px;
    width: 16px;
  }
  & .MuiSlider-markLabel {
    font-family: "RelativeMono";
    color: ${colors.primaryWhite};
    font-size: 11px;
    letter-spacing: 0;
    line-height: 16px;
  }
  & .MuiSlider-rail {
    color: ${colors.darkGrey};
    height: 2px;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${colors.primaryWhite};
  align-items: center;
  gap: 5px;
`;

const DigitInput = styled.input`
  box-sizing: border-box;
  height: 36px;
  width: 54px;
  border: 1px solid ${colors.darkGrey};
  background-color: ${colors.secondaryBlack};
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 14px;
  letter-spacing: 0;
  line-height: 20px;
  text-align: center;

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const TitleWrapper = styled.div`
  display: flex;
  background-color: ${colors.darkPurpleBackground};
  align-items: center;
  margin-bottom: 16px;
  gap: 5px;
`;

const StyledInfo = styled(Info)`
  position: absolute;
`;

const Container = styled.div`
  padding: 12px;
  background-color: ${colors.darkPurpleBackground};
`;

const infoText =
  "This filter allows you to focus on places that will experience certain climate conditions specified with your filter selection. It is useful for uncovering insights related to where places in your data will converge with changing on-the-ground conditions that are relevant for those places. After you have selected a filter range, you can change the warming scenario to see how conditions change for the places in your filter.";

const ThresholdFilter = ({ onSliderValueChange, filter, min, max, unit }: Props): JSX.Element => {
  const [value, setValue] = React.useState<number[]>(filter?.value || [min, max]);

  const handleChange = (_event: Event, newValue: number | number[], activeThumb: number) => {
    onSliderValueChange(newValue as number[]);
    setValue(newValue as number[]);
  };

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    setValue((value) => {
      let newValue = [...value];
      newValue[index] = parseInt(event.target.value, 10);
      onSliderValueChange(newValue);
      return newValue;
    });
  };

  return (
    <>
      <StyledDivider />
      <Container>
        <TitleWrapper>
          <PanelHeaderTitle>Filter to find insights</PanelHeaderTitle>
          <StyledInfo text={infoText} />
        </TitleWrapper>
        <ThresholdBinning min={min} max={max} />
        <PanelContent>
          <StyledSlider
            getAriaLabel={() => "Temperature range"}
            value={value}
            onChange={handleChange}
            valueLabelDisplay="off"
            step={1}
            marks={false}
            min={min}
            max={max}
          />
          <InputWrapper>
            <InputWrapper>
              <DigitInput
                type="number"
                value={value[0]}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onInputChange(event, 0)}
              />
              {unit}
            </InputWrapper>
            <InputWrapper>
              <DigitInput
                type="number"
                value={value[1]}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onInputChange(event, 1)}
              />
              {unit}
            </InputWrapper>
          </InputWrapper>
        </PanelContent>
      </Container>
      <StyledDivider />
    </>
  );
};

export default memo(ThresholdFilter);
