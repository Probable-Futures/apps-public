import React, { MouseEventHandler } from "react";
import styled from "styled-components";
import { styles } from "@probable-futures/components-lib";
import { ReactComponent as QuizIcon } from "@probable-futures/components-lib/src/assets/icons/quiz.svg";
import { ReactComponent as SearchIcon } from "@probable-futures/components-lib/src/assets/icons/search.svg";
import { Projection } from "mapbox-gl";

import { ReactComponent as LocationOnIcon } from "../assets/icons/location-on.svg";
import { ReactComponent as LocationOffIcon } from "../assets/icons/location-off.svg";
import { ReactComponent as GlobeIcon } from "../assets/icons/globe.svg";
import { ReactComponent as MapIcon } from "../assets/icons/map.svg";
import { colors } from "../consts";
import { useTranslation } from "../contexts/TranslationContext";

type Props = {
  isOpen: boolean;
  showMarkers: boolean;
  mapProjection: Projection;
  closeSheet: MouseEventHandler<HTMLDivElement>;
  onSearchClick: MouseEventHandler<HTMLElement>;
  onBehindMapsClick: MouseEventHandler<HTMLElement>;
  onMarkerClick: MouseEventHandler<HTMLElement>;
  onProjectionChange: MouseEventHandler<HTMLElement>;
};

const Container = styled.div`
  opacity: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 3;
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
  showMarkers,
  mapProjection,
  closeSheet,
  onBehindMapsClick,
  onMarkerClick,
  onSearchClick,
  onProjectionChange,
}: Props) => {
  const { translate } = useTranslation();
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
        <ActionSheetItem onClick={onMarkerClick}>
          {showMarkers ? <LocationOnIcon /> : <LocationOffIcon />}
          <span>{translate("actionSheet.marker")}</span>
        </ActionSheetItem>
        <ActionSheetItem className="about-maps-toggle" onClick={onBehindMapsClick}>
          <QuizIcon />
          <span>{translate("actionSheet.behindTheMaps")}</span>
        </ActionSheetItem>
        <ActionSheetItem className="projection-toggle" onClick={onProjectionChange}>
          {mapProjection.name === "globe" ? <MapIcon /> : <GlobeIcon />}
          <span>
            {mapProjection.name === "globe"
              ? translate("mapControl.showMap")
              : translate("mapControl.showGlobe")}
          </span>
        </ActionSheetItem>
      </ActionSheet>
    </Container>
  );
};

export default ActionsSheet;
