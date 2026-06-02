import { useState, MouseEventHandler } from "react";
import MediaQuery from "react-responsive";
import { components, styles } from "@probable-futures/components-lib";
import styled, { css } from "styled-components";
import { ReactComponent as DownloadIcon } from "@probable-futures/components-lib/src/assets/icons/download.svg";
import { ReactComponent as CodeIcon } from "@probable-futures/components-lib/src/assets/icons/code.svg";
import { ReactComponent as CompareIcon } from "@probable-futures/components-lib/src/assets/icons/compare.svg";
import { ReactComponent as QRIcon } from "@probable-futures/components-lib/src/assets/icons/qr.svg";

import { ReactComponent as ZoomInIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-in.svg";
import { ReactComponent as ZoomOutIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-out.svg";
import { ReactComponent as PublicOnIcon } from "@probable-futures/components-lib/src/assets/icons/public-on.svg";
import { ReactComponent as PhotoCameraIcon } from "@probable-futures/components-lib/src/assets/icons/photo-camera.svg";
import { ReactComponent as PublicOffIcon } from "@probable-futures/components-lib/src/assets/icons/public-off.svg";
import { Projection } from "mapbox-gl";
import { Popover } from "react-tiny-popover";

import { useMapData } from "../contexts/DataContext";
import { size } from "../consts";
import { ReactComponent as MoreIcon } from "../assets/icons/more.svg";
import { ReactComponent as CloseIcon } from "../assets/icons/close-thick.svg";
import { ReactComponent as GlobeIcon } from "../assets/icons/globe.svg";
import { ReactComponent as MapIcon } from "../assets/icons/map.svg";
import { ReactComponent as ThermometerWarmerIcon } from "../assets/icons/thermometer-warmer.svg";
import { ReactComponent as ThermometerCoolerIcon } from "../assets/icons/thermometer-cooler.svg";
import { ReactComponent as DeviceThermostatIcon } from "../assets/icons/device-thermostat.svg";
import ActionsSheet from "./ActionsSheet";
import { useTranslation } from "../contexts/TranslationContext";
import { setQueryParam } from "../utils";
import {
  colors,
  customTabletSizeForHeader,
  datasetsWithMidValuesOnly,
} from "@probable-futures/lib/src/consts";
import { Map } from "@probable-futures/lib/src/types";
import { ReactComponent as VisibilityIcon } from "@probable-futures/components-lib/src/assets/icons/visibility.svg";
import { ReactComponent as CancelCircleIcon } from "@probable-futures/components-lib/src/assets/icons/cancel-circle.svg";
import { ReactComponent as TourIcon } from "../assets/icons/tour.svg";
import { useTourData } from "../contexts/TourContext";
import { trackEvent } from "../utils/analytics";
import { trackMixpanelEvent, AnalyticsEvent } from "../utils/mixpanelAnalytics";

type Props = {
  zoom: number;
  onZoom: Function;
  maxZoom: number;
  selectedDataset?: Map;
  onDownloadClick: MouseEventHandler<HTMLButtonElement>;
  onTakeScreenshot: MouseEventHandler<HTMLButtonElement>;
  onDownloadQRCode: (url: string) => void;
  onExportSimpleMapClick: () => void;
};

type GroupProps = {
  position: "top" | "middle" | "bottom";
};

const topStyledGroupCss = css`
  top: 165px;

  @media (min-width: ${size.tablet}) {
    top: 75px;
  }
  @media (min-width: ${customTabletSizeForHeader}) {
    top: 100px;
  }
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
  background-color: ${colors.white};

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
    right: 10px;
  }
`;

const AdjustViewMenu = styled.div`
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

const AdjustViewMenuList = styled.ul`
  list-style-type: none;
  margin: 9px;
  padding: 0;
`;

const AdjustViewMenuListItem = styled.li<{ disabled?: boolean; selected?: boolean }>`
  border-radius: 6px;
  cursor: ${({ disabled, selected }) =>
    disabled ? "not-allowed" : selected ? "default" : "pointer"};
  padding: 7px 5px;
  margin-bottom: 6px;
  display: flex;
  gap: 8px;
  justify-content: start;
  align-items: center;
  color: ${({ selected }) => (selected ? colors.purple : colors.dimBlack)};
  font-size: 10px;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  background-color: ${({ selected }) =>
    selected ? colors.lightPurpleWithOpacity : "transparent"};

  &:hover {
    background-color: ${({ disabled, selected }) =>
      disabled && !selected ? "transparent" : colors.lightPurpleWithOpacity};
  }
`;

const CenteredThermostatIcon = styled(DeviceThermostatIcon)`
  transform: translateX(-3px);
`;

const AdjustViewMenuTitle = styled.div`
  color: ${colors.lightGrey2};
  font-family: LinearSans;
  font-size: 9px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  margin-bottom: 15px;
  margin-left: 8px;
`;

const TourCloseIconWrapper = styled.div`
  cursor: pointer;
  display: flex;
  margin-left: auto;

  svg {
    width: 20px;
    height: 20px;

    path {
      fill: ${colors.darkPurple};
    }
  }

  :hover {
    svg {
      path {
        fill: ${colors.purple};
      }
    }
  }
`;

const MapControls = ({
  zoom,
  maxZoom,
  onZoom,
  selectedDataset,
  onTakeScreenshot,
  onDownloadClick,
  onDownloadQRCode,
  onExportSimpleMapClick,
}: Props) => {
  const [showDownloadTooltip, setShowDownloadTooltip] = useState(false);
  const [showAdjustViewMenu, setShowAdjustViewMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [showZoomTooltip, setShowZoomTooltip] = useState(false);
  const [showScreenshotTooltip, setShowScreenshotTooltip] = useState(false);

  const {
    moreIsOpen,
    mapProjection,
    showCountryBorders,
    percentileValue,
    degrees,
    isComparisonMapActive,
    setMoreIsOpen,
    setMapProjection,
    setShowCountryBorders,
    setShowAboutMap,
    setSearchIsOpen,
    setPercentileValue,
    setIsComparisonMapActive,
    setComparisonScenarioBefore,
    setComparisonScenarioAfter,
  } = useMapData();
  const { translate } = useTranslation();
  const { isTourActive, setIsTourActive, setStep, steps } = useTourData();

  const onZoomIn = () => {
    if (zoom + 1 >= maxZoom) {
      setShowZoomTooltip(true);
    }
    onZoom(zoom + 1);
    trackMixpanelEvent(AnalyticsEvent.MAP_ZOOMED, {
      map_name: selectedDataset?.name,
      zoom_direction: "in",
      zoom_level: zoom + 1,
    });
  };

  const checkZoom = () => {
    if (zoom === maxZoom) {
      setShowZoomTooltip(true);
    }
  };

  const onBordersClick = () => {
    setShowCountryBorders((prev: boolean) => {
      const newValue = !prev;
      trackMixpanelEvent(AnalyticsEvent.COUNTRY_BORDERS_TOGGLED, {
        map_name: selectedDataset?.name,
        borders_visible: newValue,
      });
      return newValue;
    });
  };
  const onProjectionChange = () => {
    const newProjection: Projection = {
      name: mapProjection.name === "globe" ? "mercator" : "globe",
    };
    setMapProjection(newProjection);
    setQueryParam({ mapProjection: newProjection.name });
    trackMixpanelEvent(AnalyticsEvent.MAP_PROJECTION_CHANGED, {
      map_name: selectedDataset?.name,
      projection: newProjection.name,
    });
  };

  const onPercentileChange = (next: "low" | "mid" | "high") => {
    setPercentileValue(next);
    trackMixpanelEvent(AnalyticsEvent.PERCENTILE_VALUE_CHANGED, {
      map_name: selectedDataset?.name,
      percentile: next,
    });
  };
  const onShowWarmerYearClick = () => onPercentileChange("high");
  const onShowCoolerYearClick = () => onPercentileChange("low");
  const onShowAverageYearClick = () => onPercentileChange("mid");

  const tourMessage = isTourActive
    ? translate("mapControl.closeTheTour")
    : translate("mapControl.takeQuickTour");

  const comparisonMessage = isComparisonMapActive
    ? translate("mapControl.hideComparisonMap")
    : translate("mapControl.viewComparisonMap");

  const isChangeMap = !!(
    selectedDataset?.isDiff || selectedDataset?.name.toLowerCase().startsWith("change")
  );

  const onToggleComparisonMap = () => {
    if (isComparisonMapActive) {
      setIsComparisonMapActive(false);
      setQueryParam({ isComparisonMapActive: false, warmingScenario: degrees });
      trackMixpanelEvent(AnalyticsEvent.COMPARISON_MAP_VIEW_TOGGLED, {
        map_name: selectedDataset?.name,
        visible: false,
      });
      return;
    }
    let before: number;
    let after: number;
    if (isChangeMap) {
      before = 1;
      after = degrees === 1 ? 1.5 : degrees;
    } else if (degrees === 0.5) {
      before = 0.5;
      after = 1.5;
    } else {
      before = 0.5;
      after = degrees;
    }
    setComparisonScenarioBefore(before);
    setComparisonScenarioAfter(after);
    setIsComparisonMapActive(true);
    setQueryParam({
      isComparisonMapActive: true,
      comparisonScenarioBefore: before,
      comparisonScenarioAfter: after,
    });
    trackMixpanelEvent(AnalyticsEvent.COMPARISON_MAP_VIEW_TOGGLED, {
      map_name: selectedDataset?.name,
      visible: true,
      scenarios_compared: `${before}°C vs ${after}°C`,
    });
  };

  const onCloseTourButtonClick = (event: any) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setIsTourActive(false);
    setStep(0);
  };

  const onTakeTourButtonClick = () => {
    setIsTourActive(true);
    trackEvent("Map tour started", {
      props: {
        map: `${selectedDataset?.name}`,
      },
    });
    trackMixpanelEvent(AnalyticsEvent.MAP_TOUR_STARTED, { map_name: selectedDataset?.name });
  };

  const handleQRCodeDownload = () => {
    onDownloadQRCode(window.location.href);
    setShowDownloadTooltip(false);
  };

  const handleEmbeddableMapDownload = () => {
    onExportSimpleMapClick();
    setShowDownloadTooltip(false);
  };

  const handleOpenComparisonModal = () => {
    onDownloadClick(null as any);
    setShowDownloadTooltip(false);
  };

  const projectionTitle =
    mapProjection.name === "globe"
      ? translate("mapControl.showMap")
      : translate("mapControl.showGlobe");
  const downloadTitle = translate("mapControl.downloadTitle");
  const adjustViewTitle = translate("mapControl.adjustViewTitle");
  const downloadScreenshotTitle = translate("mapControl.downloadScreenshot");
  const countryBordersTitle = showCountryBorders
    ? translate("mapControl.hideCountryBorders")
    : translate("mapControl.showCountryBorders");
  const showWarmerYearTitle = translate("mapControl.showWarmerYear");
  const showCoolerYearTitle = translate("mapControl.showCoolerYear");
  const isMedianDataset = selectedDataset?.methodUsedForMid === "median";
  const showAverageYearTitle = translate(
    isMedianDataset ? "mapControl.showMedianYear" : "mapControl.showAverageYear",
  );
  const yearShownTitle = translate("mapControl.yearShownTitle");
  const isMidOnlyDataset =
    !!selectedDataset && datasetsWithMidValuesOnly.includes(selectedDataset.dataset.id);
  return (
    <>
      <MediaQuery maxWidth={size.tabletMax}>
        <StyledGroup position="top">
          <styles.ControlButton
            title="More"
            onClick={() => {
              setMoreIsOpen((isOpen: boolean) => {
                if (!isOpen) {
                  trackMixpanelEvent(AnalyticsEvent.MOBILE_ACTIONS_MENU_OPENED, {
                    map_name: selectedDataset?.name,
                  });
                }
                return !isOpen;
              });
            }}
            first
            last
          >
            {moreIsOpen ? <CloseIcon /> : <MoreIcon />}
          </styles.ControlButton>
        </StyledGroup>
        <ActionsSheet
          isOpen={moreIsOpen}
          mapProjection={mapProjection}
          closeSheet={() => setMoreIsOpen(false)}
          showCountryBorders={showCountryBorders}
          percentileValue={percentileValue}
          isMidOnlyDataset={isMidOnlyDataset}
          isComparisonMapActive={isComparisonMapActive}
          onSearchClick={() => {
            setMoreIsOpen(false);
            setSearchIsOpen(true);
          }}
          onAboutThisMapClick={() => {
            setShowAboutMap(true);
            setMoreIsOpen(false);
            trackMixpanelEvent(AnalyticsEvent.ABOUT_MAP_OPENED, {
              map_name: selectedDataset?.name,
            });
          }}
          onProjectionChange={() => {
            onProjectionChange();
            setMoreIsOpen(false);
          }}
          onBordersClick={() => {
            onBordersClick();
            setMoreIsOpen(false);
          }}
          onShowWarmerYearClick={() => {
            onShowWarmerYearClick();
            setMoreIsOpen(false);
          }}
          onShowCoolerYearClick={() => {
            onShowCoolerYearClick();
            setMoreIsOpen(false);
          }}
          onShowAverageYearClick={() => {
            onShowAverageYearClick();
            setMoreIsOpen(false);
          }}
          showAverageYearTitle={showAverageYearTitle}
          handleEmbeddableMapDownload={() => {
            setMoreIsOpen(false);
            handleEmbeddableMapDownload();
          }}
          handleQRCodeDownload={() => {
            setMoreIsOpen(false);
            handleQRCodeDownload();
          }}
          onTakeScreenshot={(e) => {
            setMoreIsOpen(false);
            onTakeScreenshot(e as React.MouseEvent<HTMLButtonElement, MouseEvent>);
          }}
          handleOpenComparisonModal={() => {
            setMoreIsOpen(false);
            handleOpenComparisonModal();
          }}
          onToggleComparisonMap={() => {
            setMoreIsOpen(false);
            onToggleComparisonMap();
          }}
        />
      </MediaQuery>
      <MediaQuery minWidth={size.laptop}>
        <StyledGroup position="middle">
          {/* Screenshot */}
          <components.ControlsTooltip
            tooltipContent={downloadScreenshotTitle}
            show={showScreenshotTooltip}
            onClickOutside={() => setShowScreenshotTooltip(false)}
          >
            <styles.ControlButton
              first
              disabled={!!!selectedDataset}
              title={downloadScreenshotTitle}
              onClick={onTakeScreenshot}
              onMouseEnter={() => setShowScreenshotTooltip(true)}
              onMouseLeave={() => setShowScreenshotTooltip(false)}
            >
              <PhotoCameraIcon />
            </styles.ControlButton>
          </components.ControlsTooltip>
          {/* Download */}
          <Popover
            isOpen={showDownloadTooltip}
            positions={["left"]}
            padding={10}
            content={
              <AdjustViewMenu
                onMouseEnter={() => setShowDownloadTooltip(true)}
                onMouseLeave={() => setShowDownloadTooltip(false)}
              >
                <ArrowContainer />
                <AdjustViewMenuList>
                  <AdjustViewMenuTitle>{translate("downloadMap.title")}</AdjustViewMenuTitle>
                  <AdjustViewMenuListItem onClick={handleQRCodeDownload}>
                    <QRIcon />
                    {translate("downloadMap.qrCodeOptionLabel")}
                  </AdjustViewMenuListItem>
                  <AdjustViewMenuListItem onClick={handleEmbeddableMapDownload}>
                    <CodeIcon />
                    {translate("downloadMap.simpleMapOptionLabel")}
                  </AdjustViewMenuListItem>
                  <AdjustViewMenuListItem onClick={handleOpenComparisonModal}>
                    <CompareIcon />
                    {translate("downloadMap.compareMapOptionLabel")}
                  </AdjustViewMenuListItem>
                </AdjustViewMenuList>
              </AdjustViewMenu>
            }
          >
            <styles.ControlButton
              disabled={!!!selectedDataset}
              title={downloadTitle}
              onMouseEnter={() => setShowDownloadTooltip(true)}
              onMouseLeave={() => setShowDownloadTooltip(false)}
              active={showDownloadTooltip}
            >
              <DownloadIcon />
            </styles.ControlButton>
          </Popover>
          {/* Visibility */}
          <Popover
            isOpen={showAdjustViewMenu}
            positions={["left"]}
            padding={10}
            content={
              <AdjustViewMenu
                onMouseEnter={() => setShowAdjustViewMenu(true)}
                onMouseLeave={() => setShowAdjustViewMenu(false)}
              >
                <ArrowContainer />
                <AdjustViewMenuList>
                  <AdjustViewMenuTitle>{adjustViewTitle}</AdjustViewMenuTitle>
                  <AdjustViewMenuListItem onClick={onProjectionChange}>
                    {mapProjection.name === "globe" ? <MapIcon /> : <GlobeIcon />}
                    {projectionTitle}
                  </AdjustViewMenuListItem>
                  <AdjustViewMenuListItem onClick={onBordersClick}>
                    {showCountryBorders ? <PublicOffIcon /> : <PublicOnIcon />}
                    {countryBordersTitle}
                  </AdjustViewMenuListItem>
                  <AdjustViewMenuListItem onClick={onToggleComparisonMap}>
                    <CompareIcon />
                    {comparisonMessage}
                  </AdjustViewMenuListItem>
                  {Object.keys(steps).length > 0 && (
                    <AdjustViewMenuListItem
                      onClick={onTakeTourButtonClick}
                      className="pf-map-tour-box"
                    >
                      <TourIcon />
                      <span>{tourMessage}</span>
                      {isTourActive && (
                        <TourCloseIconWrapper onClick={onCloseTourButtonClick}>
                          <CancelCircleIcon />
                        </TourCloseIconWrapper>
                      )}
                    </AdjustViewMenuListItem>
                  )}
                </AdjustViewMenuList>
              </AdjustViewMenu>
            }
          >
            <styles.ControlButton
              last={isMidOnlyDataset}
              disabled={!!!selectedDataset}
              title={adjustViewTitle}
              onMouseEnter={() => setShowAdjustViewMenu(true)}
              onMouseLeave={() => setShowAdjustViewMenu(false)}
              active={showAdjustViewMenu}
            >
              <VisibilityIcon />
            </styles.ControlButton>
          </Popover>
          {/* Year shown */}
          {!isMidOnlyDataset && (
          <Popover
            isOpen={showYearMenu}
            positions={["left"]}
            padding={10}
            content={
              <AdjustViewMenu
                onMouseEnter={() => setShowYearMenu(true)}
                onMouseLeave={() => setShowYearMenu(false)}
              >
                <ArrowContainer />
                <AdjustViewMenuList>
                  <AdjustViewMenuListItem
                    selected={percentileValue === "high"}
                    onClick={percentileValue === "high" ? undefined : onShowWarmerYearClick}
                  >
                    <ThermometerWarmerIcon />
                    {showWarmerYearTitle}
                  </AdjustViewMenuListItem>
                  <AdjustViewMenuListItem
                    selected={percentileValue === "mid"}
                    onClick={
                      percentileValue === "mid" ? undefined : onShowAverageYearClick
                    }
                  >
                    <CenteredThermostatIcon />
                    {showAverageYearTitle}
                  </AdjustViewMenuListItem>
                  <AdjustViewMenuListItem
                    selected={percentileValue === "low"}
                    onClick={percentileValue === "low" ? undefined : onShowCoolerYearClick}
                  >
                    <ThermometerCoolerIcon />
                    {showCoolerYearTitle}
                  </AdjustViewMenuListItem>
                </AdjustViewMenuList>
              </AdjustViewMenu>
            }
          >
            <styles.ControlButton
              last
              disabled={!!!selectedDataset}
              title={yearShownTitle}
              onMouseEnter={() => setShowYearMenu(true)}
              onMouseLeave={() => setShowYearMenu(false)}
              active={showYearMenu}
            >
              {percentileValue === "high" ? (
                <ThermometerWarmerIcon />
              ) : percentileValue === "low" ? (
                <ThermometerCoolerIcon />
              ) : (
                <DeviceThermostatIcon />
              )}
            </styles.ControlButton>
          </Popover>
          )}
        </StyledGroup>
        <StyledGroup position="bottom">
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
                disabled={zoom > maxZoom}
                title="Zoom In"
                onClick={onZoomIn}
                first
              >
                <ZoomInIcon />
              </styles.ControlButton>
            </styles.ButtonContainer>
          </components.ControlsTooltip>
          <styles.ControlButton
            title="Zoom Out"
            onClick={() => {
              onZoom(zoom - 1);
              trackMixpanelEvent(AnalyticsEvent.MAP_ZOOMED, {
                map_name: selectedDataset?.name,
                zoom_direction: "out",
                zoom_level: zoom - 1,
              });
            }}
            last
          >
            <ZoomOutIcon />
          </styles.ControlButton>
        </StyledGroup>
      </MediaQuery>
    </>
  );
};

export default MapControls;
