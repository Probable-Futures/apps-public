import { PropsWithChildren } from "react";
import styled from "styled-components";
import { components } from "react-select";
import {
  HEADER_DROPDOWN_PADDING_DESKTOP,
  HEADER_DROPDOWN_PADDING_LAPTOP,
  HEADER_DROPDOWN_PADDING_MOBILE,
  HEADER_DROPDOWN_PADDING_TABLET,
  size,
  Theme,
} from "@probable-futures/lib";

import TriangleIcon from "../../assets/icons/triangle.svg";
import { whiteFilter } from "../../styles/commonStyles";

type ArrowIconProps = {
  menuIsOpen: boolean;
  theme: Theme;
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

const StyledGroupArrowIcon = styled(ArrowIcon)`
  margin-left: auto;
`;

const CategoryHeader = styled.button`
  border: none;
  background: none;
  text-align: left;
  font-size: 20px;
  letter-spacing: 0;
  line-height: 29px;
  cursor: pointer;
  width: 100%;
  padding: 5px 25px 10px ${HEADER_DROPDOWN_PADDING_MOBILE};
  height: 71px;
  display: flex;
  align-items: center;
  border-bottom: ${({ isExpanded }: { isExpanded: boolean }) =>
    isExpanded ? "1px solid" : "none"};

  @media (min-width: ${size.tablet}) {
    padding-left: ${HEADER_DROPDOWN_PADDING_TABLET};
  }

  @media (min-width: ${size.laptop}) {
    padding-left: ${HEADER_DROPDOWN_PADDING_LAPTOP};
  }

  @media (min-width: ${size.desktop}) {
    padding-left: ${HEADER_DROPDOWN_PADDING_DESKTOP};
  }
`;

const StyledGroupHeading = styled(({ isExpanded, ...props }) => (
  <components.GroupHeading {...props} />
))`
  & + div {
    overflow: hidden;
    opacity: ${({ isExpanded }: { isExpanded: boolean }) => (isExpanded ? "1" : "0")};
    max-height: ${({ isExpanded }: { isExpanded: boolean }) => (isExpanded ? "100vh" : "0")};
    transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
  }
`;

export const GroupHeading = ({ children, selectProps, ...rest }: PropsWithChildren<any>) => {
  const isExpanded = selectProps.customProps.expandedCategory === children;
  return (
    <StyledGroupHeading isExpanded={isExpanded} {...rest}>
      <CategoryHeader
        onClick={() =>
          selectProps.customProps.setExpandedCategory(isExpanded ? undefined : children)
        }
        isExpanded={isExpanded}
        style={{ color: selectProps.customProps.color }}
      >
        {children}
        <StyledGroupArrowIcon menuIsOpen={isExpanded} theme={selectProps.customProps.theme} />
      </CategoryHeader>
    </StyledGroupHeading>
  );
};
