import { memo } from "react";
import styled from "styled-components";
import { Field } from "@kepler.gl/types";

import DropDownList from "../Common/DropDownList";
import { MapStyleLabel } from "components/Common";
import CloseIcon from "../../../assets/icons/map/close.svg";
import { colors } from "../../../consts";

const DropdownListContainer = styled.div`
  position: relative;
`;

const FieldSelector = styled.div`
  height: 36px;
  border: ${({ toggled }: { toggled: boolean }) =>
    `1px solid ${toggled ? colors.primaryWhite : colors.darkGrey}`};
  background-color: ${colors.secondaryBlack};
  color: ${colors.primaryWhite};
  padding: 5px 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-top: 6px;
  font-family: LinearSans;
  font-size: 14px;
`;

const StyledIcon = styled.i`
  display: inline-block;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  cursor: pointer;
  position: absolute;
  right: 10px;
  width: 12px;
  height: 12px;
`;

const Placeholder = styled.div`
  word-break: break-all;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  margin-right: 12px;
`;

type Props = {
  filteredOptions: Field[] | undefined;
  options: Field[];
  isErasable: boolean;
  label?: string;
  placeholder: string;
  handleChange: (e: any) => void;
  onSelectItem: (option: Field | null) => void;
  toggleShowDropdown: (show?: boolean) => void;
  showDropdown: boolean;
};

const ItemSelector = (props: Props): JSX.Element => {
  return (
    <div>
      {props.label && <MapStyleLabel>{props.label}</MapStyleLabel>}
      <DropdownListContainer>
        <FieldSelector onClick={() => props.toggleShowDropdown()} toggled={props.showDropdown}>
          <Placeholder>{props.placeholder}</Placeholder>
          {props.isErasable && (
            <StyledIcon
              icon={CloseIcon}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                props.onSelectItem(null);
              }}
            />
          )}
        </FieldSelector>
        {props.showDropdown && props.options.length > 0 && (
          <DropDownList
            handleChange={props.handleChange}
            handleClickOutside={() => props.toggleShowDropdown(false)}
            filteredOptions={props.filteredOptions}
            onSelectItem={props.onSelectItem}
          />
        )}
      </DropdownListContainer>
    </div>
  );
};

export default memo(ItemSelector);
