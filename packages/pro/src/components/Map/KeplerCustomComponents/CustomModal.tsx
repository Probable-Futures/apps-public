import React, { PropsWithChildren } from "react";
import styled from "styled-components";
import Modal from "react-modal";
import { FormattedMessage } from "@kepler.gl/localization";
import { Button as KeplerButton } from "@kepler.gl/components";
import { media } from "@kepler.gl/styles";
import { ModalDialogOwnProps } from "@kepler.gl/components/dist/common/modal";

import { Button, StyledCloseIcon } from "../../Common";
import CloseIcon from "../../../assets/icons/dashboard/close.svg";
import { colors } from "../../../consts";

const ModalContentWrapper = styled.div`
  overflow-y: auto;
  max-width: 70vw;
  max-height: 85vh;
  padding: 24px 72px 40px;
  position: relative;
  top: 92px;
  left: 0;
  right: 0;
  margin: 0 auto;
  background-color: ${colors.primaryWhite};
  border-radius: 4px;
  transition: ${(props: any) => props.theme.transition};
  box-sizing: border-box;
  font-size: 12px;
  color: ${(props: any) => props.theme.labelColorLT};
  .modal--title {
    color: ${colors.black};
    font-family: LinearSans;
    font-size: 24px;
    letter-spacing: 0;
    line-height: 32px;
  }
  .export-image-modal > div:first-child {
    justify-content: flex-start;
    padding: 30px 0px;
    gap: 30px;
  }

  ${media.portable`
    padding: 12px 36px 24px;
    max-width: 80vw;
  `}

  ${media.palm`
    max-width: 100vw;
  `}

  ${(props: { cssStyle: any }) => props.cssStyle || ""};
`;

const ModalContent = styled.div`
  position: relative;
  z-index: ${(props) => props.theme.modalContentZ};
`;

export const ModalTitle = styled.div`
  font-size: ${(props) => props.theme.modalTitleFontSize};
  color: ${(props) => props.theme.modalTitleColor};
  margin-bottom: 10px;
  position: relative;
  z-index: ${(props) => props.theme.modalTitleZ};
`;

const StyledModalFooter = styled.div`
  width: 100%;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-top: 24px;
  ${media.portable`
    padding-top: 24px;
  `};

  ${media.palm`
    padding-top: 16px;
  `};
  z-index: ${(props) => props.theme.modalFooterZ};
  padding-top: 0px;
`;

const CloseButton = styled.div`
  color: ${(props) => props.theme.titleColorLT};
  display: flex;
  justify-content: flex-end;
  z-index: ${(props) => props.theme.modalButtonZ};
  position: absolute;
  top: 24px;
  right: 24px;

  :hover {
    cursor: pointer;
  }
`;

const FooterActionWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const defaultCancelButton = {
  link: true,
  large: true,
  children: "modal.button.defaultCancel",
};

const defaultConfirmButton = {
  cta: true,
  large: true,
  width: "160px",
  children: "modal.button.defaultConfirm",
};

type FooterProps = {
  confirmButton: any;
  cancelButton: any;
  cancel: any;
  confirm: any;
  exportImage: boolean;
};
export const ModalFooter = ({
  cancel,
  confirm,
  cancelButton,
  confirmButton,
  exportImage,
}: FooterProps) => {
  const cancelButtonProps = { ...defaultCancelButton, ...cancelButton };
  const confirmButtonProps = { ...defaultConfirmButton, ...confirmButton };
  return (
    <StyledModalFooter className="modal--footer">
      <FooterActionWrapper>
        {exportImage ? (
          <Button onClick={confirm}>Export</Button>
        ) : (
          <>
            <KeplerButton
              className="modal--footer--cancel-button"
              {...cancelButtonProps}
              onClick={cancel}
            >
              <FormattedMessage id={cancelButtonProps.children} />
            </KeplerButton>
            <KeplerButton
              className="modal--footer--confirm-button"
              {...confirmButtonProps}
              onClick={confirm}
            >
              <FormattedMessage id={confirmButtonProps.children} />
            </KeplerButton>
          </>
        )}
      </FooterActionWrapper>
    </StyledModalFooter>
  );
};

const ModalDialog = (props: PropsWithChildren<ModalDialogOwnProps>) => {
  const exportImage = props.title === "modal.title.exportImage";
  return (
    <Modal
      // isOpen={false}
      {...props}
      ariaHideApp={false}
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          // in case we want to override the modal dialog style
          ...props.style,
        },
      }}
    >
      <ModalContentWrapper className="modal--wrapper" cssStyle={props.cssStyle as any}>
        {props.close && (
          <CloseButton className="modal--close" onClick={props.onCancel}>
            <StyledCloseIcon icon={CloseIcon} />
          </CloseButton>
        )}
        <div>
          {props.title && (
            <ModalTitle className="modal--title">
              <FormattedMessage id={props.title} />
            </ModalTitle>
          )}
          <ModalContent className="modal--body">{props.children}</ModalContent>
          {props.footer && (
            <ModalFooter
              cancel={props.onCancel}
              confirm={props.onConfirm}
              cancelButton={props.cancelButton}
              confirmButton={props.confirmButton}
              exportImage={exportImage}
            />
          )}
        </div>
      </ModalContentWrapper>
    </Modal>
  );
};

ModalDialog.defaultProps = {
  footer: false,
  close: true,
  onConfirm: () => {},
  onCancel: () => {},
  confirmButton: defaultConfirmButton,
  cancelButton: defaultCancelButton,
  cssStyle: [],
};

const StyledModal = styled(ModalDialog)`
  top: 0;
  left: 0;
  transition: ${(props) => props.theme.transition};
  padding-left: 40px;
  padding-right: 40px;

  ${media.portable`
    padding-left: 24px;
    padding-right: 24px;
  `};

  ${media.palm`
    padding-left: 0;
    padding-right: 0;
  `};

  :focus {
    outline: 0;
  }
`;

export default StyledModal;
