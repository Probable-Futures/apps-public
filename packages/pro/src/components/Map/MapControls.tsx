import { MouseEventHandler, useState } from "react";
import { components, styles } from "@probable-futures/components-lib";
import styled, { css } from "styled-components";
import { ReactComponent as DownloadIcon } from "@probable-futures/components-lib/src/assets/icons/download.svg";
import { ReactComponent as ZoomInIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-in.svg";
import { ReactComponent as ZoomOutIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-out.svg";
import { ReactComponent as IFrameIcon } from "@probable-futures/components-lib/src/assets/icons/iframe.svg";

import { ReactComponent as ShareIcon } from "../../assets/icons/map/share.svg";
import { colors, size } from "../../consts";

type Props = {
  zoom: number;
  maxZoom: number;
  minZoom: number;
  projectId: string;
  onZoom: Function;
  onScreenshot: MouseEventHandler<HTMLButtonElement>;
  onShareClick: MouseEventHandler<HTMLButtonElement>;
  onDownloadClick: MouseEventHandler<HTMLButtonElement>;
  onExportClick: MouseEventHandler<HTMLButtonElement>;
};

type GroupProps = {
  position: "top" | "middle" | "bottom";
};

const topStyledGroupCss = css`
  top: 165px;
`;

const middleStyledGroupsCss = css`
  bottom: 215px;

  @media (min-width: ${size.laptop}) {
    bottom: 155px;
  }
`;

const bottomStyledGroupsCss = css`
  bottom: 135px;

  @media (min-width: ${size.laptop}) {
    bottom: 75px;
  }
`;

const StyledGroup = styled(styles.Group)`
  background-color: ${colors.darkPurple};
  z-index: 1;
  right: 29px;
  ${({ position }: GroupProps) =>
    position === "top"
      ? topStyledGroupCss
      : position === "bottom"
      ? bottomStyledGroupsCss
      : middleStyledGroupsCss}

  @media (min-width: ${size.tablet}) {
    display: flex;
    position: absolute;
    right: 18px;
  }

  @media (min-width: ${size.laptop}) {
    right: 29px;
  }
`;

export default function MapControls({
  zoom,
  maxZoom,
  onZoom,
  onScreenshot,
  onShareClick,
  onDownloadClick,
  onExportClick,
}: Props): JSX.Element {
  const [showZoomTooltip, setShowZoomTooltip] = useState(false);
  const [showScreenshotTooltip, setShowScreenshotTooltip] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showExportTooltip, setShowExportTooltip] = useState(false);

  const screenShotTitle = "Save and download current view";
  const shareTitle = "Share a link to your project";
  const exportTitle = "Export embeddable map";

  const onZoomIn = () => {
    if (zoom + 1 >= maxZoom) {
      setShowZoomTooltip(true);
    }
    onZoom(zoom + 1);
  };

  const checkZoom = () => {
    if (zoom === maxZoom) {
      setShowZoomTooltip(true);
    }
  };

  return (
    <>
      <StyledGroup position="middle">
        {/* take screenshot */}
        <components.ControlsTooltip
          tooltipContent={screenShotTitle}
          show={showScreenshotTooltip}
          onClickOutside={() => setShowScreenshotTooltip(false)}
        >
          <styles.ControlButton
            title={screenShotTitle}
            onClick={onScreenshot}
            onMouseEnter={() => setShowScreenshotTooltip(true)}
            onMouseLeave={() => setShowScreenshotTooltip(false)}
            first
            mode="dark"
          >
            <DownloadIcon />
          </styles.ControlButton>
        </components.ControlsTooltip>
        {/* share */}
        <components.ControlsTooltip
          tooltipContent={shareTitle}
          show={showShareTooltip}
          onClickOutside={() => setShowShareTooltip(false)}
        >
          <styles.ControlButton
            title={shareTitle}
            onClick={onShareClick}
            onMouseEnter={() => setShowShareTooltip(true)}
            onMouseLeave={() => setShowShareTooltip(false)}
            mode="dark"
          >
            <ShareIcon />
          </styles.ControlButton>
        </components.ControlsTooltip>

        {/* export map as html */}
        <components.ControlsTooltip
          tooltipContent={exportTitle}
          show={showExportTooltip}
          onClickOutside={() => setShowExportTooltip(false)}
        >
          <styles.ControlButton
            title={exportTitle}
            onClick={onExportClick}
            onMouseEnter={() => setShowExportTooltip(true)}
            onMouseLeave={() => setShowExportTooltip(false)}
            mode="dark"
            last
          >
            <IFrameIcon />
          </styles.ControlButton>
        </components.ControlsTooltip>
      </StyledGroup>
      <StyledGroup position="bottom">
        <components.ControlsTooltip
          tooltipContent="This is the closest zoom level"
          show={showZoomTooltip}
          onClickOutside={() => setShowZoomTooltip(false)}
        >
          <styles.ButtonContainer
            onMouseEnter={checkZoom}
            onMouseLeave={() => setShowZoomTooltip(false)}
          >
            <styles.ControlButton
              disabled={zoom === maxZoom}
              title="Zoom In"
              onClick={onZoomIn}
              first
              mode="dark"
            >
              <ZoomInIcon />
            </styles.ControlButton>
          </styles.ButtonContainer>
        </components.ControlsTooltip>
        <styles.ControlButton title="Zoom Out" onClick={() => onZoom(zoom - 1)} last mode="dark">
          <ZoomOutIcon />
        </styles.ControlButton>
      </StyledGroup>
    </>
  );
}
