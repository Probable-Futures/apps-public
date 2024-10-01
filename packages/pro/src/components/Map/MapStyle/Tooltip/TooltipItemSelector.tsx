import React, { useState, memo } from "react";
import styled from "styled-components";
import uniqBy from "lodash.uniqby";
import { SortableHandle, SortableContainer, SortableElement } from "react-sortable-hoc";

import DotsIcon from "../../../../assets/icons/map/multi-dots.svg";
import CloseIcon from "../../../../assets/icons/map/close.svg";
import Accessor from "../../Common/Accessor";
import { arrayMove, toArray } from "../../../../utils";
import { DatasetFields } from "../../../../shared/types";
import ItemSelector from "../../Common/ItemSelector";
import { colors } from "../../../../consts";

type Props = {
  getOptionValue: any;
  displayOption: any;
  selectedItems: DatasetFields[];
  options: DatasetFields[];
  onChange: any;
  multiSelect: any;
};

type SortableElementProps = {
  item: DatasetFields;
  onRemoveClick: (e: any, item: DatasetFields) => void;
};

type SortableContainerProps = {
  items: DatasetFields[];
  onRemoveClick: (e: any, item: DatasetFields) => void;
};

const SelectedItem = styled.div`
  display: flex;
  align-items: center;
  background-color: #787279;
  height: 31px;
  padding: 6px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 12px;
  letter-spacing: 0;
  line-height: 20px;
  margin-bottom: 2px;
`;

const StyledIcon = styled.i`
  display: inline-block;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
`;

const StyledDotsIcon = styled(StyledIcon)`
  margin-right: 15px;
  height: 12.5px;
  width: 7.5px;
`;

const StyledCloseIcon = styled(StyledIcon)`
  cursor: pointer;
  height: 11px;
  width: 11px;
  margin-left: auto;
`;

const StyledDragHandle = styled.div`
  display: flex;
  align-items: center;
  :hover {
    cursor: move;
    color: ${(props) => props.theme.textColorHl};
  }
`;

const TooltipText = styled.div`
  word-break: break-all;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  margin-right: 12px;
  width: 80%;
`;

const SortableStyledItem = styled.div`
  z-index: ${(props) => props.theme.dropdownWrapperZ + 1};

  &.sorting {
    pointer-events: none;
  }

  &.sorting-layers .layer-panel__header {
    background-color: ${(props) => props.theme.panelBackgroundHover};
    font-family: ${(props) => props.theme.fontFamily};
    font-weight: ${(props) => props.theme.fontWeight};
    font-size: ${(props) => props.theme.fontSize};
    line-height: ${(props) => props.theme.lineHeight};
    *,
    *:before,
    *:after {
      box-sizing: border-box;
    }
    .layer__drag-handle {
      opacity: 1;
      color: ${(props) => props.theme.textColorHl};
    }
  }
`;

const DragHandle = SortableHandle(() => (
  <StyledDragHandle className="layer__drag-handle">
    <StyledDotsIcon icon={DotsIcon} />
  </StyledDragHandle>
));

const SortableItem = SortableElement<SortableElementProps>(
  ({ item, onRemoveClick }: SortableElementProps) => (
    <SortableStyledItem>
      <SelectedItem>
        <DragHandle />
        <TooltipText>{item?.displayName}</TooltipText>
        <StyledCloseIcon icon={CloseIcon} onClick={(e) => onRemoveClick(e, item)} />
      </SelectedItem>
    </SortableStyledItem>
  ),
);

const WrappedSortableContainer = SortableContainer<SortableContainerProps>(
  ({ items, onRemoveClick }: SortableContainerProps) => (
    <div>
      {items.map((item, index) => {
        return (
          <SortableItem
            key={`layer-${index}`}
            index={index}
            item={item}
            onRemoveClick={onRemoveClick}
          />
        );
      })}
    </div>
  ),
);

function TooltipItemSelector(props: Props): JSX.Element {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<DatasetFields[]>(props.options);

  const onShowDropdown = (show?: boolean) => {
    setFilteredOptions(props.options);
    setShowDropdown(show ? show : !showDropdown);
  };

  const handleChange = (event: any) => {
    const filteredData = props.options.filter((item) => {
      return event.target.value
        ? item.name.toLowerCase().includes(event.target.value.toLowerCase())
        : true;
    });
    setFilteredOptions(filteredData);
  };

  const onRemoveItem = (e: any, item: DatasetFields) => {
    e.preventDefault();
    e.stopPropagation();
    const index = props.selectedItems.findIndex((t) => t === item);

    if (index < 0) {
      return;
    }

    const items = [
      ...props.selectedItems.slice(0, index),
      ...props.selectedItems.slice(index + 1, props.selectedItems.length),
    ];

    props.onChange(items);
  };

  const onSelectItem = (item: DatasetFields | null) => {
    const getValue = Accessor.generateOptionToStringFor(
      props.getOptionValue || props.displayOption,
    );

    const previousSelected = toArray(props.selectedItems);

    if (props.multiSelect) {
      const items = uniqBy(previousSelected.concat(toArray(item)), getValue);
      props.onChange(items);
    } else {
      props.onChange(getValue(item));
    }

    setFilteredOptions(props.options.filter((option: any) => option.id !== item?.id));
  };

  const handleSort = ({ oldIndex, newIndex }: any) => {
    const newItems = arrayMove(props.selectedItems, oldIndex, newIndex);
    props.onChange([...newItems]);
  };

  return (
    <div>
      <WrappedSortableContainer
        onSortEnd={handleSort}
        lockAxis="y"
        helperClass="sorting-layers"
        useDragHandle
        items={props.selectedItems}
        onRemoveClick={onRemoveItem}
      />
      <ItemSelector
        placeholder="Select a field"
        showDropdown={showDropdown}
        filteredOptions={filteredOptions}
        options={props.options}
        isErasable={false}
        onSelectItem={onSelectItem}
        handleChange={handleChange}
        toggleShowDropdown={(show) => onShowDropdown(show)}
      />
    </div>
  );
}

export default memo(TooltipItemSelector);
