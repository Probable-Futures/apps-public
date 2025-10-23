import React, { useRef } from "react";
import styled from "styled-components";
import { Field } from "@kepler.gl/types";

import SearchIcon from "@probable-futures/components-lib/src/assets/icons/search.svg";
import { styles, hooks } from "@probable-futures/components-lib";

import { colors } from "../../../consts";

type Props = {
  handleChange: (e: any) => void;
  filteredOptions?: Field[];
  handleClickOutside: () => void;
  onSelectItem: (option: Field) => void;
};

const DropdownListWrapper = styled.div`
  text-align: center;
  box-sizing: border-box;
  max-height: 263px;
  border: 1px solid #5e5e5e;
  background-color: #130e13;
  padding: 8px 10px 8px 10px;
  overflow-y: auto;
  position: absolute;
  width: 100%;
  z-index: 11;

  ::-webkit-scrollbar-thumb {
    background-color: ${colors.primaryWhite};
  }
  ::-webkit-scrollbar {
    width: 3px;
    height: 3px;
  }
`;

const SearchInput = styled.input`
  box-sizing: border-box;
  height: 36px;
  width: 96%;
  border: 1px solid #5e5e5e;
  background-color: ${colors.black};
  color: ${colors.primaryWhite};
  padding-left: 8px;
  font-size: 14px;
  font-family: LinearSans;
  ::placeholder {
    color: ${colors.primaryWhite};
    opacity: 1;
  }
`;

const DropdownItem = styled.div`
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 14px;
  letter-spacing: 0;
  line-height: 20px;
  padding: 5px;
  cursor: pointer;
  :hover {
    background-color: #787279;
  }
`;

const StyledIcon = styled.i`
  display: inline-block;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  cursor: pointer;
  position: absolute;
  right: 15px;
  width: 15px;
  height: 15px;
  top: 12px;
  ${styles.whiteFilter}
`;

const DropdownItemsContainer = styled.div`
  text-align: left;
`;
const ItemType = styled.span`
  color: #a8a8a8;
  font-size: 12px !important;
`;

const SearchInputWrapper = styled.div`
  position: relative;
`;

const DropdownList = (props: Props): JSX.Element => {
  const ref = useRef(null);

  hooks.useOnClickOutside(ref, props.handleClickOutside);

  return (
    <DropdownListWrapper ref={ref}>
      <SearchInputWrapper>
        <SearchInput placeholder="Search" autoFocus onChange={props.handleChange}></SearchInput>
        <StyledIcon icon={SearchIcon} />
      </SearchInputWrapper>
      <DropdownItemsContainer>
        {props.filteredOptions?.map((option, index) => (
          <DropdownItem key={index} onClick={() => props.onSelectItem(option)}>
            {option.displayName} <ItemType>({option.type})</ItemType>
          </DropdownItem>
        ))}
      </DropdownItemsContainer>
    </DropdownListWrapper>
  );
};

export default DropdownList;
