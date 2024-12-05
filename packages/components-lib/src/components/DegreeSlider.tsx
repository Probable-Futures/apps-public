import styled from "styled-components";
import { SyntheticEvent } from "react";

import { colors, degreesOptions } from "@probable-futures/lib";
import React from "react";

type Props = {
  degrees: number;
  title: string;
  min: number;
  max: number;
  onChangeCommitted?:
    | ((event: SyntheticEvent<HTMLInputElement>, value: number) => void)
    | undefined;
  onChange?: ((event: SyntheticEvent<HTMLInputElement>, value: number) => void) | undefined;
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

const SliderContainer = styled.div`
  position: relative;
  margin: 10px 18px 0;
  width: 246px;
`;

const StyledInput = styled.input`
  -webkit-appearance: none;
  width: 100%;
  height: 2px;
  background-color: #006ec2;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: rgb(0, 110, 194);
    border-radius: 50%;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: ${colors.darkPurple};
    border-radius: 50%;
    cursor: pointer;
  }
`;

const Mark = styled.div<{ position: number }>`
  position: absolute;
  left: ${({ position }) => position}%;
  transform: translateX(-50%);
  width: 1px;
  height: 8px;
  top: 10px;
  background-color: rgb(182, 180, 183);
  cursor: pointer;
`;

const MarkLabel = styled.span<{ position: number }>`
  position: absolute;
  left: ${({ position }) => position}%;
  transform: translateX(-50%);
  top: 30px;
  font-family: LinearSans;
  color: ${colors.darkPurple};
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
`;

const DegreeSlider = ({ degrees, title, onChange, onChangeCommitted, min, max }: Props) => {
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    if (onChange) onChange(event, value);
  };

  const handleInputMouseUp = (event: React.MouseEvent<HTMLInputElement>) => {
    const value = Number(event.currentTarget.value);
    if (onChangeCommitted) onChangeCommitted(event, value);
  };

  return (
    <Container>
      <Title>{title}</Title>
      <SliderContainer>
        <StyledInput
          type="range"
          defaultValue={degrees}
          min={min}
          step={0.5}
          max={max}
          onChange={handleInputChange}
          onMouseUp={handleInputMouseUp}
        />
        {degreesOptions.map((mark) => {
          const position = ((mark.value - min) / (max - min)) * 100;
          return (
            <React.Fragment key={mark.value}>
              <Mark position={position} />
              <MarkLabel position={position}>{mark.label}</MarkLabel>
            </React.Fragment>
          );
        })}
      </SliderContainer>
    </Container>
  );
};

export default DegreeSlider;
