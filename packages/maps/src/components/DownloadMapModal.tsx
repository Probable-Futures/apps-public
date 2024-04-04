import { useState } from "react";
import styled from "styled-components";
import QRCode from "qrcode.react";
import { types } from "@probable-futures/lib";
import { components } from "@probable-futures/components-lib";
import { ReactComponent as CloseIcon } from "@probable-futures/components-lib/src/assets/icons/close.svg";
import { degreesOptions } from "@probable-futures/lib/src/consts";

import { colors, size } from "../consts";
import { useTranslation } from "../contexts/TranslationContext";

type Props = {
  isVisible: boolean;
  selectedDataset?: types.Map;
  onClose: () => void;
  onExportCompareMap: (selectedDegrees: number[]) => void;
  onDownloadQRCode: (url: string) => void;
  onExportSimpleMap: () => void;
};

type ButtonProps = {
  isDisabled?: boolean;
};

const Container = styled.div`
  position: absolute;
  z-index: 5;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  color: ${colors.textBlack};
  font-family: LinearSans;
  font-size: 18px;
  letter-spacing: 0;
  line-height: 24px;
  transition: opacity 0.2s ease-in-out;
  opacity: 0;
  pointer-events: none;

  ${({ visible }: { visible: boolean }) =>
    visible &&
    `
    opacity: 1;
    pointer-events: all;
  `}
`;

const ModalWrapper = styled.div`
  border: 1px solid ${colors.dimBlack};
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
  margin: 8em auto 0;
  width: 28em;
  box-sizing: border-box;
  background-color: ${colors.white};
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;
  padding: 15px 20px;
  height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  @media (max-width: ${size.mobileMax}) {
    width: 100%;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${colors.black};
  font-family: LinearSans;
  font-size: 22px;
  letter-spacing: 0;
  line-height: 29px;
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

const StyledCloseIcon = styled(CloseIcon)`
  cursor: pointer;
  stroke-width: 2px;

  &:hover {
    transform: scale(0.9);
  }
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

const ModalTitle = styled.div`
  width: 80%;
`;

const ModalClose = styled.button`
  cursor: pointer;
  height: 16px;
  width: 16px;
  background-color: transparent;
  border: none;
  margin-right: 5px;
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

const RadioButtonItem = styled.div`
  margin-bottom: 8px;
  position: relative;
  display: flex;
`;

const InputLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.15;
  align-self: center;
  margin-left: 15px;
  margin-bottom: 0;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 20px;
`;

const Step = styled.div`
  font-size: 12px;
  color: ${colors.dimBlack};
`;

const CompareSetionHeader = styled.p`
  font-size: 15px;
`;

const QRCodeWrapper = styled.div`
  position: absolute;
  right: 20px;
`;

const Main = styled.div`
  display: flex;
  justify-content: space-between;
  max-width: 70%;
`;

const DownloadMapModal = ({
  isVisible,
  selectedDataset,
  onClose,
  onExportCompareMap,
  onDownloadQRCode,
  onExportSimpleMap,
}: Props) => {
  const [selectedDegrees, setSelectedDegrees] = useState<Map<number, boolean>>(new Map());
  const [selectedOption, setSelectedOption] = useState<"qrCode" | "simple" | "compare">("qrCode");
  const [currentStep, setCurrentStep] = useState<number>(1);
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
    switch (selectedOption) {
      case "qrCode":
        onDownloadQRCode(window.location.href);
        break;
      case "simple":
        onExportSimpleMap();
        break;
      case "compare":
        if (selectedDegrees.size === 2) {
          onExportCompareMap(Array.from(selectedDegrees.keys()));
        }
        break;
      default:
        break;
    }
    onCloseClicked();
  };

  const onCloseClicked = () => {
    onClose();
    setTimeout(() => {
      setSelectedDegrees(new Map());
      setSelectedOption("qrCode");
      setCurrentStep(1);
    }, 200); // wait for the modal transition to finish before resetting the state. The modal take 0.2s to fully transition the opacity from 1 to 0
  };

  const renderDownloadOptions = () => {
    return (
      <div>
        <RadioButtonItem>
          <components.InputRadio
            type="radio"
            name="qrCode"
            value="qrCode"
            onChange={() => setSelectedOption("qrCode")}
            checked={selectedOption === "qrCode"}
            activeColor={colors.purple}
          />
          <InputLabel>{translate("downloadMap.qrCodeOptionLabel")}</InputLabel>
        </RadioButtonItem>
        <RadioButtonItem>
          <components.InputRadio
            type="radio"
            name="simple"
            value="simple"
            onChange={() => setSelectedOption("simple")}
            checked={selectedOption === "simple"}
            activeColor={colors.purple}
          />
          <InputLabel>{translate("downloadMap.simpleMapOptionLabel")}</InputLabel>
        </RadioButtonItem>
        <RadioButtonItem>
          <components.InputRadio
            type="radio"
            name="compare"
            value="compare"
            onChange={() => setSelectedOption("compare")}
            checked={selectedOption === "compare"}
            activeColor={colors.purple}
          />
          <InputLabel>{translate("downloadMap.compareMapOptionLabel")}</InputLabel>
        </RadioButtonItem>
      </div>
    );
  };

  const renderStepTwoForCompareMaps = () => {
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
    if (selectedOption === "compare" && currentStep === 1) {
      return (
        <Button onClick={() => setCurrentStep(2)}>
          {translate("downloadMap.selectScenarios")}
        </Button>
      );
    }
    return (
      <Button isDisabled={selectedDegrees.size < 2 && currentStep === 2} onClick={onDownload}>
        {translate("downloadMap.download")}
      </Button>
    );
  };

  const renderQrcode = () => (
    <QRCodeWrapper>
      <QRCode value={window.location.href} size={120} />
    </QRCodeWrapper>
  );

  return (
    <Container visible={isVisible}>
      <components.MapOverlay onClick={onCloseClicked} />
      <ModalWrapper>
        <ModalHeader>
          <ModalTitle>{translate("downloadMap.title")}</ModalTitle>
          <ModalClose onClick={onCloseClicked}>
            <StyledCloseIcon />
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          {currentStep === 1 && (
            <Main>
              {renderDownloadOptions()}
              {selectedOption === "qrCode" && renderQrcode()}
            </Main>
          )}
          {currentStep === 2 && selectedOption === "compare" && renderStepTwoForCompareMaps()}
        </ModalBody>
        <ButtonWrapper>
          {renderModalButtons()}
          {selectedOption === "compare" && (
            <Step>
              {translate("downloadMap.step")} {currentStep} {translate("downloadMap.of")} 2
            </Step>
          )}
        </ButtonWrapper>
      </ModalWrapper>
    </Container>
  );
};

export default DownloadMapModal;
