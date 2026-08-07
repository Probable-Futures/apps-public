import { useState } from "react";
import Select, { components } from "react-select";
import styled from "styled-components";

import { colors } from "../../consts";
import { ReactComponent as CaretUpIcon } from "../../assets/icons/caret-up.svg";

type Option = {
  value: string | number;
  label: string;
};

type IconProps = {
  menuIsOpen: boolean;
};

// The asset points up, so it is the closed state that gets rotated.
const ArrowIcon = styled.i`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  transform: ${({ menuIsOpen }: IconProps) => (menuIsOpen ? "rotate(0);" : "rotate(180deg);")};

  svg {
    width: 12px;
    height: 12px;
  }
`;

const DropdownIndicator = (props: any) => {
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <ArrowIcon menuIsOpen={props.selectProps.menuIsOpen}>
          <CaretUpIcon />
        </ArrowIcon>
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
      border: `1px solid ${isOpen ? colors.purple : colors.lightGrey}`,
      borderRadius: "6px",
      boxShadow: isOpen ? `0 0 0 3px rgba(133, 31, 255, 0.12)` : "none",
      backgroundColor: colors.white,
      padding: "0",
      fontSize: "14px",
      letterSpacing: 0,
      lineHeight: 1.3,
      cursor: "pointer",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      BoxSizing: "border-box",
      ":hover": {
        borderColor: isOpen ? colors.purple : colors.lightGrey2,
      },
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
      marginTop: "4px",
      borderRadius: "6px",
      overflow: "hidden",
      border: `1px solid ${colors.lightGrey}`,
      boxShadow: "0 6px 16px rgba(42, 23, 45, 0.12)",
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
