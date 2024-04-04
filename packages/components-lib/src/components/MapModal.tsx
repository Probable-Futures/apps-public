import { PropsWithChildren } from "react";
import styled from "styled-components";
import { colors, size } from "@probable-futures/lib/src/consts";

import { ReactComponent as CloseIcon } from "../assets/icons/close.svg";
import MapOverlay from "./MapOverlay";

type Props = {
  isVisible: boolean;
  onToggle: () => void;
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
  line-height: 29px;
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
  width: 60%;
  box-sizing: border-box;
  background-color: ${colors.white};
  position: absolute;
  z-index: 3;
  left: 0;
  right: 0;

  @media (max-width: ${size.mobileMax}) {
    width: 100%;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  line-height: 40px;
  padding: 15px 20px 5px;
  text-align: right;
`;

const StyledCloseIcon = styled(CloseIcon)`
  stroke-width: 2px;
`;

const StyledCloseIconWrapper = styled.div`
  cursor: pointer;
  width: 30px;
  height: 30px;
  text-align: center;

  &:hover {
    transform: scale(0.95);

    svg {
      transform: scale(0.95);
    }
  }
`;

const ModalBody = styled.div`
  padding: 0px 40px 15px 40px;
  text-align: left;
  max-height: 60vh;
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

const MapModal = ({ isVisible, onToggle, children }: PropsWithChildren<Props>) => (
  <Container visible={isVisible}>
    <MapOverlay onClick={onToggle} />
    <ModalWrapper>
      <ModalHeader>
        <StyledCloseIconWrapper onClick={onToggle}>
          <StyledCloseIcon />
        </StyledCloseIconWrapper>
      </ModalHeader>
      <ModalBody>{children}</ModalBody>
    </ModalWrapper>
  </Container>
);

export default MapModal;
