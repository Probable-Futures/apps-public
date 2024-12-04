import styled from "styled-components";
import { components } from "react-select";
import {
  HEADER_DROPDOWN_PADDING_DESKTOP,
  HEADER_DROPDOWN_PADDING_LAPTOP,
  HEADER_DROPDOWN_PADDING_MOBILE,
  HEADER_DROPDOWN_PADDING_TABLET,
  size,
  Option,
  Theme,
} from "@probable-futures/lib";

import ExpandIcon from "../../assets/icons/expand.svg";
import CollapseIcon from "../../assets/icons/collapse.svg";
import { whiteFilter } from "../../styles/commonStyles";

type OptionHeaderProps = {
  isOpen: boolean;
  theme: Theme;
};

const StyledOptionHeading = styled.div`
  overflow: hidden;
  opacity: ${({ isExpanded }: { isExpanded: boolean }) => (isExpanded ? "1" : "0")};
  max-height: ${({ isExpanded }: { isExpanded: boolean }) => (isExpanded ? "100vh" : "0")};
  transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
`;

const OptionHeader = styled.button`
  border: none;
  background: none;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.9px;
  line-height: 11px;

  cursor: pointer;
  width: 100%;
  text-transform: uppercase;
  padding: 25px 20px 15px ${HEADER_DROPDOWN_PADDING_MOBILE};

  &:before {
    content: "";
    float: right;
    width: 20px;
    height: 20px;
    background-position: right center;
    background-origin: content-box;
    background-repeat: no-repeat;
    background-size: 20px auto;
    background-image: ${({ isOpen }: OptionHeaderProps) =>
      isOpen ? `url(${CollapseIcon})` : `url(${ExpandIcon})`};
    ${({ theme }: OptionHeaderProps) => theme === "dark" && whiteFilter}
  }

  @media (min-width: ${size.tablet}) {
    padding-right: 20px;
    padding-left: ${HEADER_DROPDOWN_PADDING_TABLET};
  }
  @media (min-width: ${size.laptop}) {
    padding-right: 12px;
    padding-left: ${HEADER_DROPDOWN_PADDING_LAPTOP};
  }
  @media (min-width: ${size.desktop}) {
    padding-left: ${HEADER_DROPDOWN_PADDING_DESKTOP};
    padding-right: 24px;
  }
`;

const OptionWrapper = styled.div`
  &:last-child {
    margin-bottom: 15px;
  }
`;

const SubCategoryHeader = styled.div`
  font-size: 11px;
  font-weight: 600;
`;

const renderNestedOption = (
  props: any,
  label: string,
  nestedOptions: Option[],
  onClick: (e: React.MouseEvent<HTMLElement>) => void,
  isExpanded: boolean,
) => {
  const { innerProps, selectOption, selectProps } = props;

  return (
    <OptionWrapper>
      <OptionHeader isOpen={isExpanded} onClick={onClick} theme={selectProps.customProps.theme}>
        <SubCategoryHeader style={{ color: selectProps.customProps.color }}>
          {label}
        </SubCategoryHeader>
      </OptionHeader>
      <StyledOptionHeading isExpanded={isExpanded} style={{ color: selectProps.customProps.color }}>
        {nestedOptions.map((nestedOption: Option, index: number) => {
          if (nestedOption.options) {
            return renderNestedOption(
              props,
              nestedOption.label,
              nestedOption.options,
              onClick,
              isExpanded,
            );
          }
          const nestedInnerProps = innerProps;
          nestedInnerProps.onClick = () => selectOption(nestedOption);
          return (
            <div key={nestedOption.value}>
              <components.Option
                {...props}
                innerProps={{ ...nestedInnerProps, id: `${nestedInnerProps.id}_${index}` }}
                className="nested-optgroup-option"
              >
                {nestedOption.label}
              </components.Option>
            </div>
          );
        })}
      </StyledOptionHeading>
    </OptionWrapper>
  );
};

export const CustomOption = (props: any) => {
  const { children, data, selectProps } = props;
  const nestedOptions = data.options;
  const isExpanded = selectProps.customProps.expandedMaps === props.data?.value;

  const onClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    selectProps.customProps.setExpandedMaps(isExpanded ? undefined : props.data?.value);
  };

  if (nestedOptions) {
    return renderNestedOption(props, data.label, nestedOptions, onClick, isExpanded);
  }

  return (
    <components.Option {...props} className="optgroup-option">
      {children}
    </components.Option>
  );
};
