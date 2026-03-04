import { MouseEventHandler, useState } from "react";
import { components, styles } from "@probable-futures/components-lib";
import styled, { css } from "styled-components";
import { ReactComponent as DownloadIcon } from "@probable-futures/components-lib/src/assets/icons/download.svg";
import { ReactComponent as ZoomInIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-in.svg";
import { ReactComponent as ZoomOutIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-out.svg";
import { ReactComponent as IFrameIcon } from "@probable-futures/components-lib/src/assets/icons/iframe.svg";
import { ReactComponent as VisibilityIcon } from "@probable-futures/components-lib/src/assets/icons/visibility.svg";
import { ReactComponent as PublicOnIcon } from "@probable-futures/components-lib/src/assets/icons/public-on.svg";
import { ReactComponent as PublicOffIcon } from "@probable-futures/components-lib/src/assets/icons/public-off.svg";
import { ReactComponent as PhotoCameraIcon } from "@probable-futures/components-lib/src/assets/icons/photo-camera.svg";
import { Popover } from "react-tiny-popover";
import { ReactComponent as DownloadOffliceIcon } from "../../assets/icons/map/download-offline.svg";
import { ReactComponent as ShareIcon } from "../../assets/icons/map/share.svg";
import { colors, size } from "../../consts";
import { useAppSelector } from "../../app/hooks";
import useProjectUpdate from "../../utils/useProjectUpdate";

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
  position: "top" | "middle" | "bottom" | "share";
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

const shareStyledGroupCss = css`
  bottom: 40px;

  @media (min-width: ${size.laptop}) {
    bottom: 30px;
  }
`;

const StyledGroup = styled(styles.Group)`
  background-color: ${colors.white};
  z-index: 1;
  right: 29px;
  ${({ position }: GroupProps) =>
    position === "top"
      ? topStyledGroupCss
      : position === "bottom"
      ? bottomStyledGroupsCss
      : position === "share"
      ? shareStyledGroupCss
      : middleStyledGroupsCss}

  @media (min-width: ${size.tablet}) {
    display: flex;
    position: absolute;
    right: 18px;
  }

  @media (min-width: ${size.laptop}) {
    right: 10px;
  }
`;

const PopoverMenu = styled.div`
  background-color: ${colors.white};
  border: 1px solid ${colors.lightGrey};
  border-radius: 6px;
  width: 180px;
  position: relative;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    right: -10px;
    width: 10px;
    height: 100%;
    background-color: transparent;
  }
`;

const ArrowContainer = styled.div`
  position: absolute;
  right: -7px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  z-index: 10;

  &:before {
    content: "";
    position: absolute;
    right: 1px;
    top: -6px;
    width: 0;
    height: 0;
    border-left: 6px solid ${colors.white};
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    z-index: 2;
  }

  &:after {
    content: "";
    position: absolute;
    right: 0;
    top: -7px;
    width: 0;
    height: 0;
    border-left: 7px solid ${colors.lightGrey};
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    z-index: 1;
  }
`;

const PopoverMenuList = styled.ul`
  list-style-type: none;
  margin: 9px;
  padding: 0;
`;

const PopoverMenuListItem = styled.li`
  border-radius: 6px;
  cursor: pointer;
  padding: 7px 5px;
  margin-bottom: 6px;
  display: flex;
  gap: 8px;
  justify-content: start;
  align-items: center;
  color: ${colors.secondaryBlack};
  font-size: 10px;

  &:hover {
    background-color: ${colors.lightCream};
  }
`;

const PopoverMenuTitle = styled.div`
  color: ${colors.grey};
  font-family: LinearSans;
  font-size: 9px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  margin-bottom: 15px;
  margin-left: 8px;
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
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showAdjustViewMenu, setShowAdjustViewMenu] = useState(false);

  const { showBorders } = useAppSelector((state) => state.project.mapConfig.pfMapConfig);
  const { updateProject } = useProjectUpdate();

  const screenShotTitle = "Save and download current view";
  const shareTitle = "Share a link to your project";
  const downloadTitle = "Download";
  const adjustViewTitle = "Adjust view";
  const countryBordersTitle = showBorders ? "Hide country borders" : "Show country borders";

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

  const onBordersClick = () => {
    updateProject({
      mapStyleConfig: { key: "showBorders", value: !showBorders },
    });
    setShowAdjustViewMenu(false);
  };

  const handleDownloadDataClick = (e: React.MouseEvent<HTMLLIElement>) => {
    onDownloadClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
    setShowDownloadMenu(false);
  };

  const handleExportMapClick = (e: React.MouseEvent<HTMLLIElement>) => {
    onExportClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
    setShowDownloadMenu(false);
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
          >
            <PhotoCameraIcon />
          </styles.ControlButton>
        </components.ControlsTooltip>

        {/* download */}
        <Popover
          isOpen={showDownloadMenu}
          positions={["left"]}
          padding={10}
          content={
            <PopoverMenu
              onMouseEnter={() => setShowDownloadMenu(true)}
              onMouseLeave={() => setShowDownloadMenu(false)}
            >
              <ArrowContainer />
              <PopoverMenuList>
                <PopoverMenuTitle>Download</PopoverMenuTitle>
                <PopoverMenuListItem onClick={handleDownloadDataClick}>
                  <DownloadOffliceIcon />
                  Download your data
                </PopoverMenuListItem>
                <PopoverMenuListItem onClick={handleExportMapClick}>
                  <IFrameIcon />
                  Export embeddable map
                </PopoverMenuListItem>
              </PopoverMenuList>
            </PopoverMenu>
          }
        >
          <styles.ControlButton
            title={downloadTitle}
            onMouseEnter={() => setShowDownloadMenu(true)}
            onMouseLeave={() => setShowDownloadMenu(false)}
            active={showDownloadMenu}
          >
            <DownloadIcon />
          </styles.ControlButton>
        </Popover>

        {/* adjust view */}
        <Popover
          isOpen={showAdjustViewMenu}
          positions={["left"]}
          padding={10}
          content={
            <PopoverMenu
              onMouseEnter={() => setShowAdjustViewMenu(true)}
              onMouseLeave={() => setShowAdjustViewMenu(false)}
            >
              <ArrowContainer />
              <PopoverMenuList>
                <PopoverMenuTitle>{adjustViewTitle}</PopoverMenuTitle>
                <PopoverMenuListItem onClick={onBordersClick}>
                  {showBorders ? <PublicOffIcon /> : <PublicOnIcon />}
                  {countryBordersTitle}
                </PopoverMenuListItem>
              </PopoverMenuList>
            </PopoverMenu>
          }
        >
          <styles.ControlButton
            last
            title={adjustViewTitle}
            onMouseEnter={() => setShowAdjustViewMenu(true)}
            onMouseLeave={() => setShowAdjustViewMenu(false)}
            active={showAdjustViewMenu}
          >
            <VisibilityIcon />
          </styles.ControlButton>
        </Popover>
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
            >
              <ZoomInIcon />
            </styles.ControlButton>
          </styles.ButtonContainer>
        </components.ControlsTooltip>
        <styles.ControlButton title="Zoom Out" onClick={() => onZoom(zoom - 1)} last>
          <ZoomOutIcon />
        </styles.ControlButton>
      </StyledGroup>

      {/* share - below zoom */}
      <StyledGroup position="share">
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
            first
            last
          >
            <ShareIcon />
          </styles.ControlButton>
        </components.ControlsTooltip>
      </StyledGroup>
    </>
  );
}
