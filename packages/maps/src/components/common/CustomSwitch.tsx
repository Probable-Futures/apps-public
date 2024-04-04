import styled from "styled-components";

import { colors } from "../../consts";

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Wrapper = styled.div`
  position: relative;
`;

const Label = styled.label`
  position: absolute;
  top: 0;
  left: 0;
  width: 36px;
  height: 20px;
  border-radius: 15px;
  background-color: #949494;
  cursor: pointer;
  &::after {
    content: "";
    display: block;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    margin: 2px;
    background-color: ${colors.white};
    transition: 0.2s;
  }
`;

const Input = styled.input`
  opacity: 0;
  z-index: 1;
  border-radius: 15px;
  width: 36px;
  height: 20px;
  &:checked + ${Label} {
    background: #006cc9;
    &::after {
      content: "";
      display: block;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      margin-left: 18px;
      transition: 0.2s;
    }
  }
`;

const Text = styled.span`
  color: ${colors.darkPurple};
  font-size: 14px;
  letter-spacing: 0;
  line-height: 16px;
  margin-left: 6px;
`;

export default function CustomSwitch({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: Function;
}): JSX.Element {
  return (
    <Container>
      <Wrapper>
        <Input
          id={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <Label htmlFor={name} />
      </Wrapper>
      <Text>{label}</Text>
    </Container>
  );
}
