import styled, { css } from "styled-components";

import { styles } from "@probable-futures/components-lib";
import { customTabletSizeForHeader, colors } from "@probable-futures/lib";

type Props = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  maxZoom: number;
};

type GroupProps = {
  position: "top" | "middle" | "bottom";
  showDegreeDescription?: boolean;
};

const topStyledGroupCss = css`
  top: 165px;

  @media (min-width: ${customTabletSizeForHeader}) {
    top: 100px;
  }
`;

const middleStyledGroupsCss = css`
  z-index: 10;
  top: 50%;
  transform: translateY(-50%);
`;

const bottomStyledGroupsCss = css`
  bottom: 75px;
`;

const StyledGroup = styled(styles.Group)`
  background-color: ${colors.white};
  ${({ position }: GroupProps) =>
    position === "top"
      ? topStyledGroupCss
      : position === "bottom"
      ? bottomStyledGroupsCss
      : middleStyledGroupsCss}

  right: 18px;
`;

const MapControls = ({ zoom, maxZoom, onZoomIn, onZoomOut }: Props) => {
  return (
    <StyledGroup position="middle">
      <styles.ButtonContainer>
        <styles.ControlButton
          style={{ fontSize: "28px" }}
          disabled={zoom > maxZoom}
          title="Zoom In"
          onClick={onZoomIn}
          first
        >
          +
        </styles.ControlButton>
      </styles.ButtonContainer>
      <styles.ControlButton style={{ fontSize: "28px" }} title="Zoom Out" onClick={onZoomOut} last>
        -
      </styles.ControlButton>
    </StyledGroup>
  );
};

export default MapControls;
