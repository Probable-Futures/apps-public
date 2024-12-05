import { useState } from "react";
import Select, { components, FormatOptionLabelMeta } from "react-select";
import styled from "styled-components";
import DarkArrow from "@probable-futures/components-lib/src/assets/icons/triangle.svg";
import { GroupedOptions } from "@probable-futures/lib";

import LightArrow from "../../assets/icons/map/arrow-down-white.svg";
import { Option } from "../../shared/types";
import { getDropDownStyles, Theme } from "../../shared/styles/styles";
import { colors } from "../../consts";
import SmallSpinner from "./SmallSpinner";

type IconProps = {
  menuIsOpen: boolean;
  dropdownTheme: Theme;
};

const ArrowIcon = styled.i`
  background-image: ${({ dropdownTheme }: IconProps) =>
    `url(${dropdownTheme === Theme.DARK ? LightArrow : DarkArrow})`};
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 12px;
  height: 12px;
  transform: ${({ menuIsOpen }: IconProps) => (menuIsOpen ? "rotate(180deg);" : "rotate(0);")};
`;

const SpinnerContainer = styled.div`
  margin: 0px 5px;
`;

const DropdownIndicator = (props: any) => {
  if (props.selectProps.isLoading) {
    return null;
  }
  return (
    components.DropdownIndicator && (
      <components.DropdownIndicator {...props}>
        <ArrowIcon
          menuIsOpen={props.selectProps.menuIsOpen}
          dropdownTheme={props.selectProps.dropdownTheme}
        />
      </components.DropdownIndicator>
    )
  );
};

const LoadingIndicator = () => (
  <SpinnerContainer>
    <SmallSpinner />
  </SpinnerContainer>
);

const groupStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  color: colors.secondaryBlack,
  fontSize: "10px",
  fontWeight: 600,
};

const formatGroupLabel = (data: any) => {
  return (
    <div style={groupStyles}>
      <span>{data.label}</span>
    </div>
  );
};

export default function Dropdown({
  value,
  options,
  onChange,
  multi,
  theme,
  disabled,
  loading,
  isSearchable = false,
  placeholder = "",
  isOptionDisabled,
  formatOptionLabel,
}: {
  value: Option | Option[] | undefined;
  options: Option[] | GroupedOptions[];
  onChange: Function;
  multi?: boolean;
  theme: Theme;
  disabled?: boolean;
  loading?: boolean;
  isSearchable?: boolean;
  placeholder?: string;
  isOptionDisabled?: (arg: any) => boolean;
  formatOptionLabel?:
    | ((option: Option, labelMeta: FormatOptionLabelMeta<Option, boolean>) => React.ReactNode)
    | undefined;
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Select
      isDisabled={disabled}
      components={{ DropdownIndicator, LoadingIndicator }}
      value={value}
      styles={getDropDownStyles(isOpen, theme)}
      options={options}
      dropdownTheme={theme}
      onMenuClose={() => setIsOpen(false)}
      onMenuOpen={() => setIsOpen(true)}
      onChange={(option) => onChange(option)}
      isMulti={multi}
      isSearchable={isSearchable}
      formatGroupLabel={formatGroupLabel}
      isOptionDisabled={isOptionDisabled}
      isLoading={loading}
      placeholder={placeholder}
      formatOptionLabel={formatOptionLabel}
    />
  );
}
