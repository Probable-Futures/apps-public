import Modal from "react-modal";
import styled from "styled-components";

import { modalStyle } from "../../shared/styles/styles";
import { ReactComponent as CloseIcon } from "../../assets/icons/dashboard/close.svg";
import { Button, ModalClose, ModalHeader, ModalTitle } from ".";
import { colors } from "../../consts";

type Props = {
  title: string;
  message: string;
  isOpen: boolean;
  subTitle?: string;
  confirmBtnText?: string;
  dismissBtnText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const StyledCloseIcon = styled(CloseIcon)`
  cursor: pointer;

  &:hover {
    transform: scale(0.9);
  }
`;

const ModalBody = styled.div`
  text-align: left;
  max-height: 400px;
  overflow-y: auto;
  font-size: 16px;

  ::-webkit-scrollbar-thumb {
    background-color: #d8d8d8;
  }
  ::-webkit-scrollbar {
    width: 3px;
    height: 3px;
  }

  p {
    margin-top: 0px;
  }
`;

const SubTitle = styled.p`
  font-weight: bold;
  font-size: 16px;
  color: ${colors.darkGrey};
`;

const CloseBtn = styled.button`
  cursor: pointer;
  font-size: 16px;
  float: right;
  display: inline-block;
  height: 40px;
  width: 130px;
  margin-top: 20px;
  color: ${colors.darkGrey};
  background-color: transparent;
  border: none;
  margin-right: 5px;

  &:hover {
    opacity: 0.6;
  }
`;

const ConfirmationModal = ({
  title,
  message,
  isOpen,
  subTitle,
  confirmBtnText = "Confirm",
  dismissBtnText,
  onCancel,
  onConfirm,
}: Props) => (
  <Modal
    isOpen={isOpen}
    style={modalStyle}
    shouldCloseOnEsc
    shouldCloseOnOverlayClick
    onRequestClose={onCancel}
    ariaHideApp={false}
  >
    <ModalHeader>
      <ModalTitle>{title}</ModalTitle>
      <ModalClose onClick={onCancel}>
        <StyledCloseIcon />
      </ModalClose>
    </ModalHeader>
    {subTitle && <SubTitle>{subTitle}</SubTitle>}
    <ModalBody dangerouslySetInnerHTML={{ __html: message }} />
    <Button onClick={onConfirm}>{confirmBtnText}</Button>
    {dismissBtnText && <CloseBtn onClick={onCancel}>{dismissBtnText}</CloseBtn>}
  </Modal>
);

export default ConfirmationModal;
