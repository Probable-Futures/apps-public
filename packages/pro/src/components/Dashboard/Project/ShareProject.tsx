import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Tooltip } from "@mui/material";
import Modal from "react-modal";
import { useMutation } from "@apollo/client";

import { ModalClose, ModalHeader, ModalTitle, StyledCloseIcon } from "../../Common";
import CloseIcon from "../../../assets/icons/dashboard/close.svg";
import { colors } from "../../../consts";
import { modalStyle } from "../../../shared/styles/styles";
import { CREATE_PARTNER_PROJECT_SHARE } from "graphql/queries/projects";

type Props = {
  projectId: string | undefined;
  onModalClose: () => void;
};

type CreatePartnerProjectShare = {
  createPartnerProjectShare: {
    pfPartnerProjectShare: {
      id: string;
    };
  };
};

const CopyLink = styled.button`
  width: 75px;
  margin-left: auto;
  border: 1px solid ${colors.secondaryBlack};
  background-color: transparent;
  color: ${colors.secondaryBlack};
  font-size: 14px;
  cursor: pointer;
  margin-left: 10px;
  &:hover {
    border: 1px solid ${colors.secondaryBlue};
    color: ${colors.secondaryBlue};
  }
`;

const StyledPublicLink = styled.div`
  height: 16px;
  width: 205px;
  color: ${colors.secondaryBlack};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 16px;
  margin-bottom: 8px;
`;

const StyledInput = styled.div`
  display: inline-flex;
  box-sizing: border-box;
  height: 40px;
  width: 80%;
  border: 1px solid #979797;
  background-color: ${colors.primaryWhite};
  padding: 0px 14px;
  justify-content: center;
  align-items: center;
  div {
    white-space: nowrap;
    overflow: hidden !important;
    text-overflow: ellipsis;
  }
`;

const ShareLinkInfo = styled.p`
  font-size: 14px;
  letter-spacing: 0;
  line-height: 18px;
  width: 80%;
`;

const ShareProject = ({ projectId, onModalClose }: Props): JSX.Element => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [shareLink, setShareLink] = React.useState("");
  const copyLinkRef = useRef<HTMLInputElement>(null);
  const [tooltipText, setTooltipText] = useState("Copy to clipboard");

  const [createProjectShare, { data: projectShare }] = useMutation(CREATE_PARTNER_PROJECT_SHARE);
  const projectShareNode = (projectShare as CreatePartnerProjectShare) || undefined;

  useEffect(() => {
    setModalOpen(projectId !== undefined);
  }, [projectId]);

  const closeModal = () => {
    setModalOpen(false);
    onModalClose();
  };

  const onCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(copyLinkRef.current?.firstChild?.textContent || "");
      setTooltipText("Copied!");
    } catch (err) {
      setTooltipText("Error!");
    }
  };

  useEffect(() => {
    if (projectId) {
      createProjectShare({
        variables: {
          projectId,
        },
      });
    }
  }, [projectId, createProjectShare]);

  useEffect(() => {
    if (projectShareNode) {
      setShareLink(
        `${window.location.origin}/share?slugId=${projectShareNode.createPartnerProjectShare.pfPartnerProjectShare.id}`,
      );
    }
  }, [projectShareNode]);

  return (
    <Modal isOpen={modalOpen} onRequestClose={closeModal} ariaHideApp={false} style={modalStyle}>
      <ModalHeader>
        <ModalTitle>Share with anyone</ModalTitle>
        <ModalClose onClick={closeModal}>
          <StyledCloseIcon icon={CloseIcon} />
        </ModalClose>
      </ModalHeader>
      <div>
        <ShareLinkInfo>
          With this public link, anyone on the web can view this visualization and look at the data.{" "}
        </ShareLinkInfo>
        <StyledPublicLink>Public Link</StyledPublicLink>
        <div style={{ display: "flex" }}>
          <StyledInput ref={copyLinkRef}>
            <div>{shareLink}</div>
          </StyledInput>
          <Tooltip title={tooltipText} placement="top">
            <CopyLink
              onClick={onCopyClick}
              onMouseOut={() => {
                setTooltipText("Copy to clipboard");
              }}
            >
              Copy
            </CopyLink>
          </Tooltip>
        </div>
      </div>
    </Modal>
  );
};

export default ShareProject;
