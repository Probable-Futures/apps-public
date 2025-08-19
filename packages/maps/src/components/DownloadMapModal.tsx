import { useEffect, useState } from "react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";
import { components } from "@probable-futures/components-lib";
import { degreesOptions } from "@probable-futures/lib/src/consts";

import { colors, size } from "../consts";
import { useTranslation } from "../contexts/TranslationContext";

type Props = {
  isVisible: boolean;
  selectedDataset?: types.Map;
  onClose: () => void;
  onExportCompareMap: (selectedDegrees: number[]) => void;
};

type ButtonProps = {
  isDisabled?: boolean;
};

const ModalWrapper = styled.div`
  box-sizing: border-box;
  padding: 15px 20px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 35px;

  @media (max-width: ${size.mobileMax}) {
    width: 100%;
  }
`;

const Button = styled.button`
  cursor: pointer;
  font-size: 16px;
  float: left;
  display: inline-block;
  min-width: 130px;
  padding: 14px 34px;
  color: ${colors.white};
  background-color: ${colors.darkPurple};
  border: none;

  &:hover {
    background-color: ${colors.purple};
    color: ${colors.whiteOriginal};
  }

  ${({ isDisabled }: ButtonProps) => isDisabled && `pointer-events: none; opacity: 0.5;`}
`;

const ModalBody = styled.div`
  overflow-y: auto;

  ::-webkit-scrollbar {
    width: 10px;
  }

  ::-webkit-scrollbar-track {
    border-radius: 10px;
  }

  ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 10px;
  }

  p {
    margin-top: 0px;
  }
`;

const DegreeWrapper = styled.div`
  border-radius: 4px;
  display: flex;
  justify-content: center;
  gap: 5px;
`;

const DegreeBox = styled.button`
  color: ${colors.darkPurple};
  background-color: ${colors.white};
  box-sizing: border-box;
  font-weight: 500;
  font-size: 0.8125rem;
  line-height: 1.75;
  letter-spacing: 1px;
  padding: 10px;
  border: none;
  border-bottom: 5px solid transparent;
  cursor: pointer;

  &:hover {
    background-color: #eeeeee;
  }

  ${({ selected }: { selected: boolean }) =>
    selected &&
    `
    background-color: #eeeeee;
    border-bottom: 5px solid ${colors.darkPurple};
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 20px;
`;

const CompareSetionHeader = styled.p`
  font-size: 15px;
`;

const DownloadMapModal = ({ isVisible, selectedDataset, onClose, onExportCompareMap }: Props) => {
  const [selectedDegrees, setSelectedDegrees] = useState<Map<number, boolean>>(new Map());
  const { translate } = useTranslation();

  const onDegreeClicked = (value: number) => {
    if (
      value === 0.5 &&
      (selectedDataset?.isDiff || selectedDataset?.name.toLowerCase().startsWith("change"))
    ) {
      return;
    }
    setSelectedDegrees((prevSelectedDegrees) => {
      const newSelectedDegrees = new Map(prevSelectedDegrees);
      if (prevSelectedDegrees.get(value)) {
        newSelectedDegrees.delete(value);
        return newSelectedDegrees;
      } else {
        if (prevSelectedDegrees.size === 2) {
          return prevSelectedDegrees;
        }
        newSelectedDegrees.set(value, true);
        return newSelectedDegrees;
      }
    });
  };

  const onDownload = () => {
    if (selectedDegrees.size === 2) {
      onExportCompareMap(Array.from(selectedDegrees.keys()));
    }

    onCloseClicked();
  };

  const onCloseClicked = () => {
    onClose();
    setTimeout(() => {
      setSelectedDegrees(new Map());
    }, 200); // wait for the modal transition to finish before resetting the state. The modal take 0.2s to fully transition the opacity from 1 to 0
  };

  const renderStepOneForCompareMaps = () => {
    return (
      <>
        <CompareSetionHeader>{translate("downloadMap.compareSectionHeader")}.</CompareSetionHeader>
        <DegreeWrapper>
          {degreesOptions.map((degree) => {
            return (
              <DegreeBox
                selected={selectedDegrees.get(degree.value) as boolean}
                onClick={() => onDegreeClicked(degree.value)}
                key={degree.value}
                disabled={
                  (degree.value === 0.5 &&
                    (selectedDataset?.isDiff ||
                      selectedDataset?.name.toLowerCase().startsWith("change"))) ||
                  (selectedDegrees.size >= 2 && !!!selectedDegrees.get(degree.value))
                }
              >
                {degree.label}
              </DegreeBox>
            );
          })}
        </DegreeWrapper>
      </>
    );
  };

  const renderModalButtons = () => {
    return (
      <Button isDisabled={selectedDegrees.size < 2} onClick={onDownload}>
        {translate("downloadMap.download")}
      </Button>
    );
  };

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (typeof onClose === "function") {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose]);

  return (
    <components.MapModal
      isVisible={isVisible}
      title={translate("downloadMap.title")}
      onToggle={onCloseClicked}
      size="sm"
      closeText={translate("close.text")}
    >
      <ModalWrapper>
        <ModalBody>{renderStepOneForCompareMaps()}</ModalBody>
        <ButtonWrapper>{renderModalButtons()}</ButtonWrapper>
      </ModalWrapper>
    </components.MapModal>
  );
};

export default DownloadMapModal;
