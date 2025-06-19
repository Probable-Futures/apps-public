import { PropsWithChildren } from "react";
import styled from "styled-components";
import { colors, size } from "@probable-futures/lib";

import MapOverlay from "./MapOverlay";
import { ReactComponent as CloseIcon } from "@probable-futures/components-lib/src/assets/icons/cancel-circle.svg";
import { purpleFilter } from "../styles";

type Size = "lg" | "md" | "sm";

type Props = {
  isVisible: boolean;
  title?: string;
  size?: Size;
  closeText?: string;
  onToggle: () => void;
};

const Container = styled.div`
  position: absolute;
  z-index: 1000;
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
  transition: opacity 0.3s ease-in-out;
  opacity: 0;
  pointer-events: none;

  ${({ visible }: { visible: boolean }) =>
    visible &&
    `
    opacity: 1;
    pointer-events: all;
  `}
`;
const ModalWrapper = styled.div<{ size: Size }>`
  border: 1px solid ${colors.dimBlack};
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
  margin: 8em auto 0;
  width: 60%;
  width: ${({ size }) => (size === "lg" ? "60em" : size === "md" ? "40em" : "28em")};
  box-sizing: border-box;
  background-color: ${colors.white};
  position: absolute;
  z-index: 10;
  left: 0;
  right: 0;

  @media (max-width: ${size.mobileMax}) {
    width: 100%;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 40px;
  padding: 10px 14px;
  border-bottom: 1px solid ${colors.grey};
  text-align: right;
`;

const StyledCloseIcon = styled(CloseIcon)`
  stroke-width: 2px;
  width: 15px;
  height: 15px;
`;

const StyledCloseIconWrapper = styled.div`
  cursor: pointer;
  height: 30px;
  text-align: center;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    ${purpleFilter}
  }

  &:first-child:last-child {
    margin-left: auto;
  }
`;

const ModalBody = styled.div`
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

const Title = styled.h1`
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  margin: 0;
  padding: 0;
`;

const CloseTitle = styled.span`
  font-size: 10px;
`;

const MapModal = ({
  isVisible,
  size = "lg",
  title,
  children,
  closeText = "Close",
  onToggle,
}: PropsWithChildren<Props>) => (
  <Container visible={isVisible}>
    <MapOverlay onClick={onToggle} />
    <ModalWrapper size={size}>
      <ModalHeader>
        {title && <Title>{title}</Title>}
        <StyledCloseIconWrapper onClick={onToggle}>
          <CloseTitle>{closeText}</CloseTitle>
          <StyledCloseIcon />
        </StyledCloseIconWrapper>
      </ModalHeader>
      <ModalBody>{children}</ModalBody>
    </ModalWrapper>
  </Container>
);

export default MapModal;
