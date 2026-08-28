import { useState, MouseEventHandler } from "react";
import styled, { css } from "styled-components";
import camelcase from "lodash.camelcase";
import { Popover } from "react-tiny-popover";
import { components, styles } from "@probable-futures/components-lib";
import { ReactComponent as ZoomInIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-in.svg";
import { ReactComponent as ZoomOutIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-out.svg";
import { ReactComponent as PhotoCameraIcon } from "@probable-futures/components-lib/src/assets/icons/photo-camera.svg";
import { types } from "@probable-futures/lib";
import { colors, datasetsWithMidValuesOnly } from "@probable-futures/lib/src/consts";
import { BinningType } from "@probable-futures/lib/src/utils/colors";

import { useTranslation } from "../contexts/TranslationContext";
import { getYearIcons } from "../utils/yearIcons";

type Props = {
  zoom: number;
  maxZoom: number;
  minZoom: number;
  selectedDataset?: types.Map;
  percentileValue: BinningType;
  onZoom: (zoom: number) => void;
  onTakeScreenshot: MouseEventHandler<HTMLButtonElement>;
  setPercentileValue: (value: BinningType) => void;
};

type GroupProps = {
  position: "tools" | "zoom";
};

const ZOOM_GROUP_BOTTOM = 40;
/* Clears the zoom group (two 35px buttons plus its border) with a 10px gap. */
const TOOLS_GROUP_BOTTOM = ZOOM_GROUP_BOTTOM + 82;

const StyledGroup = styled(styles.Group)`
  background-color: ${colors.white};
  right: 10px;
  /* Above the header bar and the comparison swiper, which both claim lower layers. */
  z-index: 3;

  ${({ position }: GroupProps) =>
    position === "zoom"
      ? css`
          bottom: ${ZOOM_GROUP_BOTTOM}px;
        `
      : css`
          bottom: ${TOOLS_GROUP_BOTTOM}px;
        `}
`;

const YearMenu = styled.div`
  background-color: ${colors.white};
  border: 1px solid ${colors.grey};
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
    border-left: 7px solid ${colors.grey};
    border-top: 7px solid transparent;
    border-bottom: 7px solid transparent;
    z-index: 1;
  }
`;

const YearMenuList = styled.ul`
  list-style-type: none;
  margin: 9px;
  padding: 0;
`;

const YearMenuListItem = styled.li<{ selected?: boolean }>`
  border-radius: 6px;
  cursor: ${({ selected }) => (selected ? "default" : "pointer")};
  padding: 7px 5px;
  margin-bottom: 6px;
  display: flex;
  gap: 8px;
  justify-content: start;
  align-items: center;
  color: ${({ selected }) => (selected ? colors.purple : colors.dimBlack)};
  font-size: 10px;
  background-color: ${({ selected }) => (selected ? colors.lightPurpleWithOpacity : "transparent")};

  &:hover {
    background-color: ${colors.lightPurpleWithOpacity};
  }
`;

const MapBuilderControls = ({
  zoom,
  maxZoom,
  minZoom,
  selectedDataset,
  percentileValue,
  onZoom,
  onTakeScreenshot,
  setPercentileValue,
}: Props) => {
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [showZoomTooltip, setShowZoomTooltip] = useState(false);
  const [showScreenshotTooltip, setShowScreenshotTooltip] = useState(false);
  const { translate } = useTranslation();

  const isMidOnlyDataset =
    !!selectedDataset && datasetsWithMidValuesOnly.includes(selectedDataset.dataset.id);
  const isMedianDataset = selectedDataset?.methodUsedForMid === "median";
  const dataLabels = selectedDataset?.dataLabels;

  const viewYearVerb = translate("mapControl.viewYear");
  const getYearNoun = (label?: string) =>
    label ? translate(`mapPopover.year.${camelcase(label)}`, label).toLowerCase() : "";
  const yearTitle = (index: number, fallbackKey: string) =>
    dataLabels?.[index]
      ? `${viewYearVerb} ${getYearNoun(dataLabels?.[index])}`
      : translate(fallbackKey);
  const showWarmerYearTitle = yearTitle(2, "mapControl.showWarmerYear");
  const showCoolerYearTitle = yearTitle(0, "mapControl.showCoolerYear");
  const showAverageYearTitle = yearTitle(
    1,
    isMedianDataset ? "mapControl.showMedianYear" : "mapControl.showAverageYear",
  );
  const downloadScreenshotTitle = translate("mapControl.downloadScreenshot");
  const yearShownTitle = translate("mapControl.yearShownTitle");

  const yearIcons = getYearIcons(dataLabels);
  const HighYearIcon = yearIcons.high;
  const MidYearIcon = yearIcons.mid;
  const LowYearIcon = yearIcons.low;
  const FaceYearIcon =
    percentileValue === "high"
      ? HighYearIcon
      : percentileValue === "low"
      ? LowYearIcon
      : MidYearIcon;

  const onZoomIn = () => {
    if (zoom + 1 >= maxZoom) {
      setShowZoomTooltip(true);
    }
    onZoom(Math.min(zoom + 1, maxZoom));
  };

  const onZoomOut = () => onZoom(Math.max(zoom - 1, minZoom));

  const checkZoom = () => {
    if (zoom >= maxZoom) {
      setShowZoomTooltip(true);
    }
  };

  const renderYearItem = (
    value: BinningType,
    title: string,
    Icon: (typeof yearIcons)[keyof typeof yearIcons],
  ) => (
    <YearMenuListItem
      selected={percentileValue === value}
      onClick={percentileValue === value ? undefined : () => setPercentileValue(value)}
    >
      <Icon />
      {title}
    </YearMenuListItem>
  );

  return (
    <>
      <StyledGroup position="tools">
        <components.ControlsTooltip
          tooltipContent={downloadScreenshotTitle}
          show={showScreenshotTooltip}
          onClickOutside={() => setShowScreenshotTooltip(false)}
        >
          <styles.ControlButton
            first
            last={isMidOnlyDataset}
            disabled={!selectedDataset}
            title={downloadScreenshotTitle}
            onClick={onTakeScreenshot}
            onMouseEnter={() => setShowScreenshotTooltip(true)}
            onMouseLeave={() => setShowScreenshotTooltip(false)}
          >
            <PhotoCameraIcon />
          </styles.ControlButton>
        </components.ControlsTooltip>
        {!isMidOnlyDataset && (
          <Popover
            isOpen={showYearMenu}
            positions={["left"]}
            padding={10}
            content={
              <YearMenu
                onMouseEnter={() => setShowYearMenu(true)}
                onMouseLeave={() => setShowYearMenu(false)}
              >
                <ArrowContainer />
                <YearMenuList>
                  {renderYearItem("high", showWarmerYearTitle, HighYearIcon)}
                  {renderYearItem("mid", showAverageYearTitle, MidYearIcon)}
                  {renderYearItem("low", showCoolerYearTitle, LowYearIcon)}
                </YearMenuList>
              </YearMenu>
            }
          >
            <styles.ControlButton
              last
              disabled={!selectedDataset}
              title={yearShownTitle}
              onMouseEnter={() => setShowYearMenu(true)}
              onMouseLeave={() => setShowYearMenu(false)}
              active={showYearMenu}
            >
              <FaceYearIcon />
            </styles.ControlButton>
          </Popover>
        )}
      </StyledGroup>
      <StyledGroup position="zoom">
        <components.ControlsTooltip
          tooltipContent={translate("mapControl.maxZoomMessage")}
          show={showZoomTooltip}
          onClickOutside={() => setShowZoomTooltip(false)}
        >
          <styles.ButtonContainer
            onMouseEnter={checkZoom}
            onMouseLeave={() => setShowZoomTooltip(false)}
          >
            <styles.ControlButton
              disabled={zoom >= maxZoom}
              title="Zoom In"
              onClick={onZoomIn}
              first
            >
              <ZoomInIcon />
            </styles.ControlButton>
          </styles.ButtonContainer>
        </components.ControlsTooltip>
        <styles.ControlButton disabled={zoom <= minZoom} title="Zoom Out" onClick={onZoomOut} last>
          <ZoomOutIcon />
        </styles.ControlButton>
      </StyledGroup>
    </>
  );
};

export default MapBuilderControls;
