import { ChangeEventHandler } from "react";
import styled from "styled-components";
import { colors, size } from "@probable-futures/lib";

type Props = {
  isChecked: boolean;
  left: string;
  right: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

const Container = styled.div`
  margin-top: -6px;

  @media (min-width: ${size.laptop}) {
    margin-top: 0px;
    margin-bottom: 14px;
  }
`;

const Toggle = styled.div`
  position: relative;
  width: 62px;
  height: 22px;
  background-color: ${colors.white};
  border-radius: 4px;
  margin: 0 5px;
  border: 1px solid ${colors.darkPurple};
  box-sizing: border-box;
  display: flex;
  font-family: "RelativeMono";
  font-size: 13px;
  letter-spacing: 0;
  line-height: 16px;
  text-align: center;
  user-select: none;
  align-items: center;

  .toggle-span {
    position: absolute;
    top: 2px;
    left: 3px;
    width: 25px;
    height: 16px;
    border-radius: 4px;
    transition: 0.2s;
    background-color: ${colors.darkPurple};
  }

  @media (min-width: ${size.laptop}) {
    margin: 0 7px 0 9px;
  }
`;

const Label = styled.label`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;

  &:active {
    .toggle-span {
      width: 30px;
    }
  }

  &:hover {
    ${Toggle} {
      border: 1px solid ${colors.purple};

      .toggle-span {
        background-color: ${colors.purple};
      }
    }
  }
`;

const Input = styled.input`
  display: none;

  &:checked + ${Label} {
    .toggle-span {
      left: calc(100% - 3px);
      transform: translateX(-100%);
    }
  }
`;

const Option = styled.span`
  flex: 1;
  transition: color 0.6s ease;
  z-index: 1;

  color: ${({ isChecked }: { isChecked: boolean }) =>
    isChecked ? colors.white : colors.darkPurple};
`;

const Switch = ({ isChecked, left, right, onChange }: Props) => (
  <Container>
    <Input checked={isChecked} onChange={onChange} id="toggle" type="checkbox" />
    <Label htmlFor="toggle">
      <Toggle>
        <Option isChecked={!isChecked} id="toggle-option1">
          {left}
        </Option>
        <Option isChecked={isChecked} id="toggle-option2">
          {right}
        </Option>
        <span className="toggle-span" />
      </Toggle>
    </Label>
  </Container>
);

export default Switch;
