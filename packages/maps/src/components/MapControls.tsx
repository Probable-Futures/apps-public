import React, { useState, MouseEventHandler, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MediaQuery from "react-responsive";
import { components, styles } from "@probable-futures/components-lib";
import styled, { css } from "styled-components";
import { ReactComponent as QuizIcon } from "@probable-futures/components-lib/src/assets/icons/quiz.svg";
import { ReactComponent as DownloadIcon } from "@probable-futures/components-lib/src/assets/icons/download.svg";
import { ReactComponent as ZoomInIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-in.svg";
import { ReactComponent as ZoomOutIcon } from "@probable-futures/components-lib/src/assets/icons/zoom-out.svg";
import { ReactComponent as SearchIcon } from "@probable-futures/components-lib/src/assets/icons/search.svg";
import { ReactComponent as PublicOnIcon } from "@probable-futures/components-lib/src/assets/icons/public-on.svg";
import { ReactComponent as PublicOffIcon } from "@probable-futures/components-lib/src/assets/icons/public-off.svg";
import { Projection } from "mapbox-gl";

import { defaultDegreesForChangeMaps, useMapData } from "../contexts/DataContext";
import { size, colors } from "../consts";
import TourButton from "./TourButton";
import { ReactComponent as LocationOnIcon } from "../assets/icons/location-on.svg";
import { ReactComponent as LocationOffIcon } from "../assets/icons/location-off.svg";
import { ReactComponent as MoreIcon } from "../assets/icons/more.svg";
import { ReactComponent as CloseIcon } from "../assets/icons/close-thick.svg";
import { ReactComponent as PhotoCarmeraIcon } from "../assets/icons/photo-camera.svg";
import { ReactComponent as GlobeIcon } from "../assets/icons/globe.svg";
import { ReactComponent as MapIcon } from "../assets/icons/map.svg";
import ActionsSheet from "./ActionsSheet";
import { useTranslation } from "../contexts/TranslationContext";
import { setQueryParam } from "../utils";
import { customTabletSizeForHeader } from "@probable-futures/lib/src/consts";
import { Map } from "@probable-futures/lib/src/types";
import ChatbotIframe from "./ChatbotIframe";
import { fly } from "@probable-futures/lib/src/utils";
import { MapRef } from "react-map-gl";
import { sendDataToChatbot } from "../utils/chatbot";

type Props = {
  zoom: number;
  onZoom: Function;
  maxZoom: number;
  selectedDataset?: Map;
  onDownloadClick: MouseEventHandler<HTMLButtonElement>;
  onTakeScreenshot: MouseEventHandler<HTMLButtonElement>;
  mapRef: React.RefObject<MapRef>;
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
  ${({ showDegreeDescription }: GroupProps) =>
    showDegreeDescription
      ? "z-index: 1; transition: z-index 0s step-end;"
      : "z-index: 4; transition: z-index 0.2s step-end;"}

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

const ChatbotIframeWrapper = styled.div`
  display: flex;
  position: absolute;
  bottom: 80px;
  right: 70px;
`;

const MapControls = ({
  zoom,
  maxZoom,
  onZoom,
  selectedDataset,
  onDownloadClick,
  onTakeScreenshot,
  mapRef,
}: Props) => {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showMarkerTooltip, setShowMarkerTooltip] = useState(false);
  const [showDownloadTooltip, setShowDownloadTooltip] = useState(false);
  const [showZoomTooltip, setShowZoomTooltip] = useState(false);
  const [showProjectionTooltip, setShowProjectionTooltip] = useState(false);
  const [showScreenshotTooltip, setShowScreenshotTooltip] = useState(false);
  const [showCountryBordersTooltip, setShowCountryBordersTooltip] = useState(false);
  const {
    showMarkers,
    searchIsOpen,
    moreIsOpen,
    showDegreeDescription,
    mapProjection,
    degrees,
    datasets,
    setDegrees,
    setSelectedDataset,
    showCountryBorders,
    setMoreIsOpen,
    setShowMarkers,
    setSearchIsOpen,
    setMapProjection,
    setShowCountryBorders,
  } = useMapData();
  const [showSearchTooltip, setShowSearchTooltip] = useState(false);
  const navigate = useNavigate();
  const { translate } = useTranslation();

  const onLearnMoreClick = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", "data");
    navigate(window.location.pathname + "?" + params.toString() + window.location.hash);
  };

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
  const onMarkerClick = () => setShowMarkers((showMarkers: boolean) => !showMarkers);
  const onBordersClick = () =>
    setShowCountryBorders((showCountryBorders: boolean) => !showCountryBorders);
  const onProjectionChange = () => {
    const newProjection: Projection = {
      name: mapProjection.name === "globe" ? "mercator" : "globe",
    };
    setMapProjection(newProjection);
    setQueryParam({ mapProjection: newProjection.name });
  };

  const searchTitle = translate("mapControl.searchTitle");
  const markerTitle = showMarkers
    ? translate("mapControl.hideMarkerTitle")
    : translate("mapControl.showMarkerTitle");
  const projectionTitle =
    mapProjection.name === "globe"
      ? translate("mapControl.showMap")
      : translate("mapControl.showGlobe");
  const downloadTitle = translate("mapControl.downloadTitle");
  const behindMapsTitle = translate("mapControl.behindMapsTitle");
  const downloadScreenshotTitle = translate("mapControl.downloadScreenshot");
  const countryBordersTitle = showCountryBorders
    ? translate("mapControl.hideCountryBorders")
    : translate("mapControl.showCountryBorders");

  const selectMap = useCallback(
    (value: string) => {
      const dataset = datasets.find(({ name, isLatest }) => name === value && isLatest);
      if (dataset) {
        sendDataToChatbot({ dataset, action: "fetchData" });
        setSelectedDataset(dataset);
        let warmingScenario = undefined;
        if (
          degrees === 0.5 &&
          (dataset.isDiff || dataset?.name.toLowerCase().startsWith("change"))
        ) {
          setDegrees(defaultDegreesForChangeMaps);
          warmingScenario = defaultDegreesForChangeMaps;
        }
        setQueryParam({
          mapSlug: dataset.slug,
          warmingScenario,
          version: "latest",
        });
      }
    },
    [datasets, degrees, setDegrees, setSelectedDataset],
  );

  useEffect(() => {
    const handleChatbotMessage = (event: any) => {
      if (event.origin === "http://localhost:3000") {
        const { map } = event?.data;
        const feature = event?.data?.geocoder?.countryObject?.features[0];
        if (map) {
          selectMap(map);
        }
        if (feature) {
          fly({ feature, mapRef });
        }
      }
    };
    window.addEventListener("message", handleChatbotMessage);
    return () => {
      window.removeEventListener("message", handleChatbotMessage);
    };
  }, [mapRef, selectMap]);

  return (
    <>
      <MediaQuery maxWidth={customTabletSizeForHeader}>
        <StyledGroup position="top" showDegreeDescription={showDegreeDescription}>
          <styles.ControlButton
            title="More"
            onClick={() => setMoreIsOpen((isOpen: boolean) => !isOpen)}
            first
            last
          >
            {moreIsOpen ? <CloseIcon /> : <MoreIcon />}
          </styles.ControlButton>
        </StyledGroup>
        <ActionsSheet
          isOpen={moreIsOpen}
          showMarkers={showMarkers}
          mapProjection={mapProjection}
          closeSheet={() => setMoreIsOpen(false)}
          showCountryBorders={showCountryBorders}
          onSearchClick={() => {
            onSearchClick();
            setMoreIsOpen(false);
          }}
          onMarkerClick={() => {
            onMarkerClick();
            setMoreIsOpen(false);
          }}
          onBehindMapsClick={() => {
            onLearnMoreClick();
            setMoreIsOpen(false);
          }}
          onProjectionChange={() => {
            onProjectionChange();
            setMoreIsOpen(false);
          }}
          onBordersClick={() => {
            onBordersClick();
            setMoreIsOpen(false);
          }}
        />
      </MediaQuery>
      <MediaQuery minWidth={customTabletSizeForHeader}>
        <StyledGroup position="top" showDegreeDescription={showDegreeDescription}>
          {/* Search */}
          <components.ControlsTooltip
            tooltipContent={searchTitle}
            show={showSearchTooltip && !searchIsOpen}
            onClickOutside={() => setShowSearchTooltip(false)}
          >
            <styles.ControlButton
              disabled={!!!selectedDataset}
              title={searchTitle}
              onClick={onSearchClick}
              onMouseEnter={() => setShowSearchTooltip(true)}
              onMouseLeave={() => setShowSearchTooltip(false)}
              active={searchIsOpen}
              first
            >
              <SearchIcon />
            </styles.ControlButton>
          </components.ControlsTooltip>
          {/* Show/hide markers */}
          <components.ControlsTooltip
            tooltipContent={markerTitle}
            show={showMarkerTooltip}
            onClickOutside={() => setShowMarkerTooltip(false)}
          >
            <styles.ControlButton
              disabled={!!!selectedDataset}
              title={markerTitle}
              onClick={onMarkerClick}
              onMouseEnter={() => setShowMarkerTooltip(true)}
              onMouseLeave={() => setShowMarkerTooltip(false)}
              active={showMarkers}
            >
              {showMarkers ? <LocationOffIcon /> : <LocationOnIcon />}
            </styles.ControlButton>
          </components.ControlsTooltip>
          {/* Show/hide country borders */}
          <components.ControlsTooltip
            tooltipContent={countryBordersTitle}
            show={showCountryBordersTooltip}
            onClickOutside={() => setShowCountryBordersTooltip(false)}
          >
            <styles.ControlButton
              disabled={!!!selectedDataset}
              title={countryBordersTitle}
              onClick={onBordersClick}
              onMouseEnter={() => setShowCountryBordersTooltip(true)}
              onMouseLeave={() => setShowCountryBordersTooltip(false)}
              active={showCountryBorders}
            >
              {showCountryBorders ? <PublicOffIcon /> : <PublicOnIcon />}
            </styles.ControlButton>
          </components.ControlsTooltip>
          {/* Screenshot */}
          <components.ControlsTooltip
            tooltipContent={downloadScreenshotTitle}
            show={showScreenshotTooltip}
            onClickOutside={() => setShowScreenshotTooltip(false)}
          >
            <styles.ControlButton
              disabled={!!!selectedDataset}
              title={downloadScreenshotTitle}
              onClick={onTakeScreenshot}
              onMouseEnter={() => setShowScreenshotTooltip(true)}
              onMouseLeave={() => setShowScreenshotTooltip(false)}
            >
              <PhotoCarmeraIcon />
            </styles.ControlButton>
          </components.ControlsTooltip>
          {/* Download */}
          <components.ControlsTooltip
            tooltipContent={downloadTitle}
            show={showDownloadTooltip}
            onClickOutside={() => setShowDownloadTooltip(false)}
          >
            <styles.ControlButton
              disabled={!!!selectedDataset}
              title={downloadTitle}
              onClick={onDownloadClick}
              onMouseEnter={() => setShowDownloadTooltip(true)}
              onMouseLeave={() => setShowDownloadTooltip(false)}
            >
              <DownloadIcon />
            </styles.ControlButton>
          </components.ControlsTooltip>
          {/* Behind maps */}
          <components.ControlsTooltip
            tooltipContent={behindMapsTitle}
            show={showInfoTooltip}
            onClickOutside={() => setShowInfoTooltip(false)}
          >
            <styles.ControlButton
              className="about-maps-toggle"
              disabled={!!!selectedDataset}
              title={behindMapsTitle}
              onClick={onLearnMoreClick}
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <QuizIcon />
            </styles.ControlButton>
          </components.ControlsTooltip>
          {/* Tour */}
          <TourButton last={true} />
        </StyledGroup>
        <StyledGroup position="middle" showDegreeDescription={showDegreeDescription}>
          <components.ControlsTooltip
            tooltipContent={projectionTitle}
            show={showProjectionTooltip}
            onClickOutside={() => setShowProjectionTooltip(false)}
          >
            <styles.ControlButton
              disabled={!!!selectedDataset}
              title={projectionTitle}
              onClick={onProjectionChange}
              onMouseEnter={() => setShowProjectionTooltip(true)}
              onMouseLeave={() => setShowProjectionTooltip(false)}
              first
              last
            >
              {mapProjection.name === "globe" ? <MapIcon /> : <GlobeIcon />}
            </styles.ControlButton>
          </components.ControlsTooltip>
        </StyledGroup>
        <ChatbotIframeWrapper>
          <ChatbotIframe selectedData={selectedDataset} degrees={degrees} />
        </ChatbotIframeWrapper>
        <StyledGroup position="bottom" showDegreeDescription={showDegreeDescription}>
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
          <styles.ControlButton title="Zoom Out" onClick={() => onZoom(zoom - 1)} last>
            <ZoomOutIcon />
          </styles.ControlButton>
        </StyledGroup>
      </MediaQuery>
    </>
  );
};

export default MapControls;
