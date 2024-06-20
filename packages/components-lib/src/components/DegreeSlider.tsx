import styled from "styled-components";
import { Slider } from "@mui/material";
import { SyntheticEvent } from "react";

import { colors } from "@probable-futures/lib/src/consts";
import { degreesOptions } from "@probable-futures/lib/src/consts";

type Props = {
  degrees: number;
  title: string;
  min: number;
  max: number;
  onChangeCommitted?:
    | ((event: Event | SyntheticEvent<Element, Event>, value: number | number[]) => void)
    | undefined;
  onChange?: ((event: Event, value: number | number[]) => void) | undefined;
};

const Container = styled.div`
  background-color: ${colors.white};
  border: 1px solid ${colors.darkPurple};
  padding: 16px 18px;
  max-width: 310px;
  max-height: 100px;
`;

const Title = styled.span`
  display: block;
  color: ${colors.darkPurple};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 12px;
  text-transform: uppercase;
`;

const StyledSlider = styled(Slider)`
  margin: 10px 18px 0;
  width: 246px !important;
  color: #006ec2 !important;
  height: 2px !important;

  & .MuiSlider-mark {
    background-color: ${colors.grey};
    height: 8px;
    width: 1px;
  }

  & .MuiSlider-track {
    height: 2px !important;
    border: none;
  }

  & .MuiSlider-thumb {
    width: 12px;
    height: 12px;
  }

  & .MuiSlider-markLabel {
    font-family: LinearSans;
    color: ${colors.darkPurple};
    font-size: 12px;
    letter-spacing: 0;
    line-height: 16px;
  }
`;

const DegreeSlider = ({ degrees, title, onChange, onChangeCommitted, min, max }: Props) => (
  <Container>
    <Title>{title}</Title>
    <StyledSlider
      value={degrees}
      marks={degreesOptions}
      valueLabelDisplay="off"
      step={null}
      min={min}
      max={max}
      onChange={onChange}
      onChangeCommitted={onChangeCommitted}
    />
  </Container>
);

export default DegreeSlider;
