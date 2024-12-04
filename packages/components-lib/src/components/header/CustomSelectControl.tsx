import styled from "styled-components";
import { components } from "react-select";

import Info from "./Info";
import TourBox from "../TourBox";
import {
  colors,
  HEADER_DROPDOWN_PADDING_DESKTOP,
  HEADER_DROPDOWN_PADDING_LAPTOP,
  HEADER_DROPDOWN_PADDING_MOBILE,
  HEADER_DROPDOWN_PADDING_TABLET,
  size,
  GroupedOptions,
  Theme,
} from "@probable-futures/lib";

const ControlContainer = styled.div`
  display: flex;
  flex-direction: row;
  position: relative;

  @media (min-width: ${size.tablet}), (orientation: landscape) {
    border-right: 1px solid
      ${({ theme }: { theme: Theme }) => (theme === "dark" ? colors.cream : colors.darkPurple)};
  }

  @media (min-width: ${size.desktop}) {
    border-left: 1px solid
      ${({ theme }: { theme: Theme }) => (theme === "dark" ? colors.cream : colors.darkPurple)};
  }

  &:hover {
    background-color: ${({ theme }: { theme: Theme }) =>
      theme === "dark" ? "transparent" : colors.cream};
    > div {
      background-color: ${({ theme }: { theme: Theme }) =>
        theme === "dark" ? "transparent" : colors.cream};
    }
  }
`;

const ParentHeader = styled.div`
  position: absolute;
  height: 11px;
  min-width: 151px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  line-height: 11px;
  left: ${HEADER_DROPDOWN_PADDING_MOBILE};
  top: 10px;
  text-transform: uppercase;

  @media (min-width: ${size.tablet}) {
    left: ${HEADER_DROPDOWN_PADDING_TABLET};
  }

  @media (min-width: ${size.laptop}) {
    left: ${HEADER_DROPDOWN_PADDING_LAPTOP};
  }

  @media (min-width: ${size.desktop}) {
    left: ${HEADER_DROPDOWN_PADDING_DESKTOP};
  }
`;

const StyledVerticalDivider = styled.div`
  box-sizing: border-box;
  height: 30px !important;
  width: 1px !important;
  transform: translate(12px, 0.8em);
  background-color: ${colors.grey} !important;
  margin: 0px 10px !important;
`;

const getParentCategory = (options: GroupedOptions[], value: string) => {
  let parentCategory: string = "";
  options.forEach((parentCateg) => {
    parentCateg.options.forEach((subCateg) => {
      if (subCateg.options && subCateg.options.length > 0) {
        if (subCateg.options.find((option) => option.value === value)) {
          parentCategory = parentCateg.label;
        }
      } else if (subCateg.value === value) {
        parentCategory = parentCateg.label;
      }
    });
  });
  return parentCategory;
};

export const Control = (props: any) => {
  const value = props.selectProps?.value?.value;
  const { customProps } = props.selectProps;
  const parentCategory: string =
    props.options && value ? getParentCategory(props.options as GroupedOptions[], value) : "";

  const container = (
    <ControlContainer theme={customProps.theme}>
      <components.Control {...props} />
      <StyledVerticalDivider />
      <ParentHeader style={{ color: customProps.color }}>{parentCategory}</ParentHeader>
      <Info
        showDescriptionModal={customProps.showDescriptionModal}
        onInfoClick={customProps.onInfoClick}
      />
    </ControlContainer>
  );

  return customProps.showTour ? (
    <TourBox
      show={customProps.isTourActive && customProps.step === 0}
      position="bottom"
      {...customProps}
    >
      {container}
    </TourBox>
  ) : (
    container
  );
};
