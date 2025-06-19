import styled from "styled-components";
import { useMemo, useCallback } from "react";

import { types } from "@probable-futures/lib";
import { Option, Map } from "@probable-futures/lib/src/types";
import { generateGroupedDatasets } from "@probable-futures/components-lib/src/utils/dataset";
import { colors } from "@probable-futures/lib/src/consts";
import MapModal from "./MapModal";

type Props = {
  value: Option;
  isVisible: boolean;
  selectedDataset?: types.Map;
  datasets: Map[];
  translatedDatasets?: any;
  allMapsTitle?: string;
  closeText?: string;
  onClose: () => void;
  onChange?: (option: Option) => void;
};

const ModalBody = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 18px 30px 30px 30px;
`;

const Column = styled.div`
  flex: 1;
  line-height: 20px;
  font-size: 14px;
`;

const ColumnTitle = styled.h3<{ extraPadding?: boolean }>`
  font-weight: 600;
  padding-left: 8px;
  margin-bottom: 10px;
  color: ${colors.black};
  ${({ extraPadding }) => extraPadding && `padding-top: 20px;`}
`;

const MapOption = styled.div<{ isSelected: boolean }>`
  padding: 8px 10px;
  border-radius: 4px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: ${({ isSelected }) =>
    isSelected ? `${colors.lightPurple}!important` : "transparent"};
  position: relative;

  &:hover {
    background-color: ${colors.lightPurpleWithOpacity};
  }
`;

const AllMapsModal = ({
  value,
  isVisible,
  datasets,
  translatedDatasets,
  allMapsTitle = "All maps",
  closeText = "Close",
  onClose,
  onChange,
}: Props) => {
  const handleOptionClick = useCallback(
    (option: Option) => {
      if (onChange) {
        onChange(option);
      }
      onClose();
    },
    [onChange, onClose],
  );

  const groupedDatasets = useMemo(
    () => generateGroupedDatasets(datasets, translatedDatasets),
    [datasets, translatedDatasets],
  );

  return (
    <MapModal
      isVisible={isVisible}
      title={allMapsTitle}
      closeText={closeText}
      onToggle={onClose}
      size="lg"
    >
      <ModalBody>
        {groupedDatasets.slice(0, -2).map((section) => (
          <Column key={section.label}>
            <ColumnTitle>{section.label}</ColumnTitle>
            {section.options?.map((option) => (
              <MapOption
                key={option.value}
                onClick={() => handleOptionClick(option)}
                isSelected={value.value === option.value}
              >
                {option.label}
              </MapOption>
            ))}
          </Column>
        ))}
        <Column>
          {groupedDatasets.slice(-2).map((section, index) => (
            <div key={section.label}>
              <ColumnTitle extraPadding={index !== 0}>{section.label}</ColumnTitle>
              {section.options?.map((option) => (
                <MapOption
                  key={option.label}
                  onClick={() => handleOptionClick(option)}
                  isSelected={value.value === option.value}
                >
                  {option.label}
                </MapOption>
              ))}
            </div>
          ))}
        </Column>
      </ModalBody>
    </MapModal>
  );
};

export default AllMapsModal;
