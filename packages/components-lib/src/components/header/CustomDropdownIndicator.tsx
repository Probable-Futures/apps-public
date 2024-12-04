import { components } from "react-select";
import styled from "styled-components";
import { types } from "@probable-futures/lib";

import TriangleIcon from "../../assets/icons/triangle.svg";
import { whiteFilter } from "../../styles/commonStyles";

type ArrowIconProps = {
  menuIsOpen: boolean;
  theme: types.Theme;
};

const ArrowIcon = styled.i`
  background-image: url(${TriangleIcon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 13px;
  height: 13px;
  transform: ${({ menuIsOpen }: ArrowIconProps) => (menuIsOpen ? "rotate(180deg);" : "rotate(0);")};
  ${({ theme }: ArrowIconProps) => theme === "dark" && whiteFilter}
`;

export const DropdownIndicator = (props: any) => (
  <components.DropdownIndicator {...props}>
    <ArrowIcon
      menuIsOpen={props.selectProps.menuIsOpen}
      theme={props.selectProps.customProps.theme}
    />
  </components.DropdownIndicator>
);
