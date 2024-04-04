import React from "react";
import styled from "styled-components";
import Modal from "react-modal";
import { Button } from "@material-ui/core";
import { CSVLink } from "react-csv";

import { modalStyle } from "../../shared/styles/styles";
import { colors } from "../../consts";
import { ModalClose, ModalHeader, ModalTitle, StyledCloseIcon, StyledDivider } from ".";
import CloseIcon from "../../assets/icons/dashboard/close.svg";
import WarningIcon from "../../assets/icons/map/warning.svg";
import SuccessIcon from "../../assets/icons/map/success.svg";

const ModalContent = styled.div`
  background-color: ${colors.white};
  color: ${colors.darkPurple};
  margin-bottom: 20px;
`;
const StatsWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  height: 130px;
  align-items: center;
`;
const Count = styled.div`
  color: ${({ success }: { success: boolean }) => (success ? "#08a15c" : "#ee6611")};
  font-family: LinearSans;
  flex-grow: 1;
  flex-basis: 50%;
  &:last-child {
    display: flex;
    height: 100%;
    align-items: center;
  }
`;
const Number = styled.span`
  display: block;
  font-size: 48px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 58px;
`;
const Status = styled.span`
  text-transform: uppercase;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 16px;
  display: flex;
  align-items: center;
  gap: 5px;
`;
const TextSection = styled.div`
  margin-top: 20px;
  ul {
    list-style-position: inside;
    padding-left: 0;
    padding-right: 0;
  }
  p,
  li {
    font-size: 14px;
    letter-spacing: 0;
    line-height: 16px;
  }
`;
const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-item: center;
  margin-top: 20px;
  button {
    box-sizing: border-box;
    height: 40px;
    width: 188px;
    border: 1px solid ${colors.secondaryBlack};
    color: ${colors.secondaryBlack};
    font-family: LinearSans;
    font-size: 16px;
    letter-spacing: 0;
    line-height: 28px;
    text-align: center;
    border-radius: 0px;
    &:last-child {
      background-color: ${colors.secondaryBlack};
      color: ${colors.primaryWhite};
    }
    a {
      text-decoration: none;
      &:hover {
        color: ${colors.secondaryBlack} !important;
      }
    }
  }
`;
const StyledIcon = styled.i`
  display: inline-block;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 15px;
  height: 15px;
`;

export type Props = {
  errorsCount?: number;
  successCount?: number;
  typeOfErros?: string[];
  fileName?: string;
  onGoBack: () => void;
  onComplete?: () => void;
  onClose: () => void;
  getFileData?: () => Array<any>;
};

const ImportReview = ({
  successCount,
  errorsCount,
  fileName,
  onClose,
  onComplete,
  onGoBack,
  getFileData,
}: Props): JSX.Element => {
  const hasErrors = !!errorsCount;
  const errorMessage = `To fix, please export the error log for more information and return to the upload data
  screen to reupload the dataset. You can also choose to proceed without updating the
  errors, but those rows with the errors will not be included.`;
  const successMessage = "All of your data rows have been imported successfully!";

  return (
    <Modal
      isOpen={true}
      ariaHideApp={false}
      style={{ ...modalStyle, content: { ...modalStyle.content, width: "636px" } }}
    >
      <ModalHeader>
        <ModalTitle>Dataset import review</ModalTitle>
        <ModalClose onClick={onClose}>
          <StyledCloseIcon icon={CloseIcon} />
        </ModalClose>
      </ModalHeader>
      <ModalContent>
        <StatsWrapper>
          {!!successCount && (
            <Count success={true}>
              <div>
                <Number>{successCount}</Number>
                <Status>
                  <StyledIcon icon={SuccessIcon}></StyledIcon>
                  <span>successful row(s)</span>
                </Status>
              </div>
            </Count>
          )}
          {hasErrors && (
            <Count success={false}>
              {!!successCount && <StyledDivider orientation="vertical" variant="middle" flexItem />}

              <div>
                <Number>{errorsCount}</Number>
                <Status>
                  <StyledIcon icon={WarningIcon}></StyledIcon>
                  <span>error row(s)</span>
                </Status>
              </div>
            </Count>
          )}
        </StatsWrapper>
        <TextSection>
          <p>{hasErrors ? errorMessage : successMessage}</p>
        </TextSection>
        <ButtonGroup>
          {hasErrors && getFileData && (
            <Button>
              <CSVLink data={getFileData()} filename={fileName}>
                Export error file
              </CSVLink>
            </Button>
          )}
          {hasErrors && <Button onClick={onGoBack}>Go back to upload</Button>}
          {onComplete && <Button onClick={onComplete}>Complete Import </Button>}
        </ButtonGroup>
      </ModalContent>
    </Modal>
  );
};

export default ImportReview;
