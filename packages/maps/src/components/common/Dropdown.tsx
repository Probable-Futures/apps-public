import { useState } from "react";
import Select, { components } from "react-select";
import styled from "styled-components";

import { colors } from "../../consts";
import CaretUpIcon from "../../assets/icons/caret-up.svg";

type Option = {
  value: string | number;
  label: string;
};

type IconProps = {
  menuIsOpen: boolean;
};

const ArrowIcon = styled.i`
  background-image: url(${CaretUpIcon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 12px;
  height: 12px;
  transform: ${({ menuIsOpen }: IconProps) => (menuIsOpen ? "rotate(180deg);" : "rotate(0);")};
`;

const DropdownIndicator = (props: any) => {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <ArrowIcon menuIsOpen={props.selectProps.menuIsOpen} />
      </components.DropdownIndicator>
    )
  );
};

export default function Dropdown({
  value,
  options,
  onChange,
}: {
  value: Option;
  options: Option[];
  onChange: Function;
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const customStyles = {
    option: (provided: any, state: { isSelected: boolean }) => ({
      ...provided,
      fontSize: "14px",
      letterSpacing: 0,
      lineHeight: 1.3,
      minHeight: "34px",
      cursor: "pointer",
      color: state.isSelected ? colors.white : colors.darkPurple,
      backgroundColor: state.isSelected ? colors.purple : "transparent",
      ":hover": {
        color: state.isSelected ? colors.white : colors.purple,
      },
      ":active": {
        color: `${colors.white} !important`,
        backgroundColor: colors.purple,
      },
    }),
    control: () => ({
      display: "flex",
      outlineColor: colors.purple,
      border: `1px solid ${colors.black}`,
      borderWidth: isOpen ? "1px 1px 0 1px" : "1px",
      backgroundColor: colors.white,
      padding: "0",
      fontSize: "14px",
      letterSpacing: 0,
      lineHeight: 1.3,
      cursor: "pointer",
      BoxSizing: "border-box",
    }),
    input: (provided: any) => ({ ...provided, margin: 0 }),
    singleValue: (provided: any) => ({
      ...provided,
      color: isOpen ? colors.purple : colors.darkPurple,
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: "40px",
      padding: "10px 12px",
      BoxSizing: "border-box",
    }),
    menu: (provided: any) => ({
      ...provided,
      marginTop: 0,
      borderRadius: 0,
      border: `1px solid ${colors.black}`,
      borderTopColor: "#D8D8D8",
      boxShadow: "none",
    }),
    indicatorSeparator: () => ({ display: "none" }),
  };
  return (
    <Select
      components={{ DropdownIndicator }}
      value={value}
      styles={customStyles}
      options={options}
      onMenuClose={() => setIsOpen(false)}
      onMenuOpen={() => setIsOpen(true)}
      onChange={(option) => onChange(option)}
    />
  );
}
