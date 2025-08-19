import React, { MouseEventHandler } from "react";
import styled from "styled-components";
import { Projection } from "mapbox-gl";

import { styles } from "@probable-futures/components-lib";
import { ReactComponent as SearchIcon } from "@probable-futures/components-lib/src/assets/icons/search.svg";
import { ReactComponent as PublicOnIcon } from "@probable-futures/components-lib/src/assets/icons/public-on.svg";
import { ReactComponent as PublicOffIcon } from "@probable-futures/components-lib/src/assets/icons/public-off.svg";
import { ReactComponent as InfoIcon } from "@probable-futures/components-lib/src/assets/icons/info.svg";

import { ReactComponent as CodeIcon } from "@probable-futures/components-lib/src/assets/icons/code.svg";
import { ReactComponent as CompareIcon } from "@probable-futures/components-lib/src/assets/icons/compare.svg";
import { ReactComponent as QRIcon } from "@probable-futures/components-lib/src/assets/icons/qr.svg";
import { ReactComponent as PhotoCarmeraIcon } from "../assets/icons/photo-camera.svg";

import { ReactComponent as GlobeIcon } from "../assets/icons/globe.svg";
import { ReactComponent as MapIcon } from "../assets/icons/map.svg";
import { colors } from "../consts";
import { useTranslation } from "../contexts/TranslationContext";
import { size } from "@probable-futures/lib";
import { MediaQuery } from "react-responsive";

type Props = {
  isOpen: boolean;
  mapProjection: Projection;
  showCountryBorders: boolean;
  closeSheet: MouseEventHandler<HTMLDivElement>;
  onSearchClick: MouseEventHandler<HTMLElement>;
  onAboutThisMapClick: MouseEventHandler<HTMLElement>;
  onProjectionChange: MouseEventHandler<HTMLElement>;
  onBordersClick: MouseEventHandler<HTMLElement>;
  onTakeScreenshot: MouseEventHandler<HTMLElement>;
  handleQRCodeDownload: MouseEventHandler<HTMLElement>;
  handleEmbeddableMapDownload: MouseEventHandler<HTMLElement>;
  handleOpenComparisonModal: MouseEventHandler<HTMLElement>;
};

const Container = styled.div`
  opacity: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 5;
  pointer-events: none;

  ${({ show }: { show: boolean }) => show && "opacity: 1; pointer-events: all;"}
`;

const ActionSheet = styled.div`
  background: ${colors.whiteOriginal};
  position: absolute;
  bottom: 0;
  width: 100%;
  max-height: 0%;
  transition: all 0.3s;

  ${({ show }: { show: boolean }) => show && "max-height: 60%;"}
`;

const ActionSheetItem = styled.button`
  padding: 22px;
  background: transparent;
  border: none;
  color: ${colors.black};
  text-align: left;
  width: 100%;
  font-size: 18px;
  border-bottom: 1px solid ${colors.secondaryGray};
  display: flex;
  align-items: center;
  gap: 22px;
  cursor: pointer;

  &:hover {
    ${styles.ItemHoverStyles}
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ActionsSheet = ({
  isOpen,
  mapProjection,
  showCountryBorders,
  closeSheet,
  onAboutThisMapClick,
  onSearchClick,
  onProjectionChange,
  onBordersClick,
  onTakeScreenshot,
  handleQRCodeDownload,
  handleEmbeddableMapDownload,
  handleOpenComparisonModal,
}: Props) => {
  const { translate } = useTranslation();

  const downloadScreenshotTitle = translate("mapControl.downloadScreenshot");

  return (
    <Container show={isOpen} onClick={closeSheet}>
      <ActionSheet
        show={isOpen}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <ActionSheetItem onClick={onSearchClick}>
          <SearchIcon />
          <span>{translate("actionSheet.search")}</span>
        </ActionSheetItem>
        <ActionSheetItem className="projection-toggle" onClick={onProjectionChange}>
          {mapProjection.name === "globe" ? <MapIcon /> : <GlobeIcon />}
          <span>
            {mapProjection.name === "globe"
              ? translate("mapControl.showMap")
              : translate("mapControl.showGlobe")}
          </span>
        </ActionSheetItem>
        <ActionSheetItem onClick={onBordersClick}>
          {showCountryBorders ? <PublicOffIcon /> : <PublicOnIcon />}
          <span>
            {showCountryBorders
              ? translate("mapControl.hideCountryBorders")
              : translate("mapControl.showCountryBorders")}
          </span>
        </ActionSheetItem>
        <MediaQuery minWidth={size.tablet} maxWidth={size.tabletMax}>
          <ActionSheetItem onClick={onTakeScreenshot}>
            <PhotoCarmeraIcon />
            <span>{downloadScreenshotTitle}</span>
          </ActionSheetItem>
          <ActionSheetItem onClick={handleQRCodeDownload}>
            <QRIcon />
            {translate("downloadMap.qrCodeOptionLabel")}
          </ActionSheetItem>
          <ActionSheetItem onClick={handleEmbeddableMapDownload}>
            <CodeIcon />
            <span>{translate("downloadMap.simpleMapOptionLabel")}</span>
          </ActionSheetItem>
          <ActionSheetItem onClick={handleOpenComparisonModal}>
            <CompareIcon />
            <span>{translate("downloadMap.compareMapOptionLabel")}</span>
          </ActionSheetItem>
        </MediaQuery>
        <ActionSheetItem onClick={onAboutThisMapClick}>
          <InfoIcon />
          <span>{translate("actionSheet.aboutThisMap")}</span>
        </ActionSheetItem>
      </ActionSheet>
    </Container>
  );
};

export default ActionsSheet;
