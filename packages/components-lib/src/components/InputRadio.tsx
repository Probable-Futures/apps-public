import styled from "styled-components";

import { colors } from "@probable-futures/lib/src/consts";

type RadioButtonProps = {
  checked: boolean;
  activeColor: string;
};

const RadioButtonInput = styled.input`
  width: 100%;
  height: 100%;
  position: absolute;
  opacity: 0;
  cursor: pointer;
`;

const RadioButton = styled.span`
  height: 16px;
  width: 16px;
  border-radius: 50%;
  border: 1px solid ${colors.darkPurple};
  position: relative;
  box-sizing: initial;
`;

const CheckedRadioButton = styled.span`
  width: 10px;
  height: 10px;
  position: absolute;
  top: 3px;
  left: 3px;
  border-radius: 50%;
  background: ${({ checked, activeColor }: RadioButtonProps) =>
    checked ? activeColor : "transparent"};
`;

export default function RadioInput(props: any): JSX.Element {
  return (
    <>
      <RadioButton>
        <CheckedRadioButton
          checked={props.checked}
          activeColor={props.activeColor || colors.blue}
        />
      </RadioButton>
      <RadioButtonInput {...props}></RadioButtonInput>
    </>
  );
}
