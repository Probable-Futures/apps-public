import { MouseEventHandler, useState } from "react";
import { components, styles } from "@probable-futures/components-lib";
import styled from "styled-components";
import { ReactComponent as DownloadIcon } from "@probable-futures/components-lib/src/assets/icons/download.svg";
import { ReactComponent as ZoomInIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-in.svg";
import { ReactComponent as ZoomOutIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-out.svg";
import { ReactComponent as SearchIcon } from "@probable-futures/components-lib/src/assets/icons/search.svg";
import { ReactComponent as IFrameIcon } from "@probable-futures/components-lib/src/assets/icons/iframe.svg";

import { ReactComponent as DownloadOffliceIcon } from "../../assets/icons/map/download-offline.svg";
import { ReactComponent as ShareIcon } from "../../assets/icons/map/share.svg";
import { useMapData } from "../../contexts/DataContext";
import { colors } from "../../consts";

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

const StyledGroup = styled(styles.Group)`
  background-color: ${colors.darkPurple};
  z-index: 1;
  right: 29px;
  top: ${({ top }: { top: string }) => top};
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
  const [showSearchTooltip, setShowSearchTooltip] = useState(false);
  const [showScreenshotTooltip, setShowScreenshotTooltip] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [showDownloadTooltip, setShowDownloadTooltip] = useState(false);
  const [showExportTooltip, setShowExportTooltip] = useState(false);

  const { searchIsOpen, setSearchIsOpen } = useMapData();

  const searchTitle = "Find a location";
  const screenShotTitle = "Save and download current view";
  const shareTitle = "Share a link to your project";
  const downloadTitle = "Download your data";
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

  const onSearchClick = () => setSearchIsOpen((isOpen: boolean) => !isOpen);

  return (
    <>
      <StyledGroup top="calc(50% - 220px)">
        {/* Search */}
        <components.ControlsTooltip
          tooltipContent={searchTitle}
          show={showSearchTooltip && !searchIsOpen}
          onClickOutside={() => setShowSearchTooltip(false)}
        >
          <styles.ControlButton
            title={searchTitle}
            onClick={onSearchClick}
            onMouseEnter={() => setShowSearchTooltip(true)}
            onMouseLeave={() => setShowSearchTooltip(false)}
            first
            mode="dark"
          >
            <SearchIcon />
          </styles.ControlButton>
        </components.ControlsTooltip>
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
        {/* download */}
        <components.ControlsTooltip
          tooltipContent={downloadTitle}
          show={showDownloadTooltip}
          onClickOutside={() => setShowDownloadTooltip(false)}
        >
          <styles.ControlButton
            title={downloadTitle}
            onClick={onDownloadClick}
            onMouseEnter={() => setShowDownloadTooltip(true)}
            onMouseLeave={() => setShowDownloadTooltip(false)}
            mode="dark"
          >
            <DownloadOffliceIcon />
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
      <StyledGroup top="calc(50% + 50px)">
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
