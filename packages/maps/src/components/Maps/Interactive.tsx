import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import MapGL, { MapLayerMouseEvent, MapRef, ViewState, ViewStateChangeEvent } from "react-map-gl";
import { useMediaQuery } from "react-responsive";
import styled from "styled-components";
import { MapboxEvent, Map as MapBoxMap, MapSourceDataEvent } from "mapbox-gl";
import qrCode from "qrcode";
import debounce from "lodash.debounce";
import camelcase from "lodash.camelcase";

import { useMapData } from "../../contexts/DataContext";
import { useTourData } from "../../contexts/TourContext";
import MapControls from "../MapControls";
import MapSelection from "../MapSelection";
import { POPUP_DEFAULT_LOCATION } from "../../consts/mapConsts";
import useMapsApi from "../../utils/useMapsApi";
import useWPApi from "../../utils/useWPApi";
import useFeaturePopup from "../../utils/useFeaturePopup";
import { useWindowHeight } from "../../utils/useWindowHeight";
import { trackEvent } from "../../utils/analytics";
import { downloadFile, exportComponentAsPNG } from "../../utils/export";
import { size, colors } from "../../consts";
import SearchPopup from "../common/SearchPopup";
import { useTranslation } from "../../contexts/TranslationContext";
import DownloadMapModal from "../DownloadMapModal";
import useGlobeLines from "../../utils/useGlobeLines";
import { degreeToString } from "@probable-futures/lib/src/utils";
import { generateEmbedMap } from "@probable-futures/probable-futures-maps/src";
import { consts, utils } from "@probable-futures/lib";
import { components, contexts } from "@probable-futures/components-lib";
import { Feature } from "@probable-futures/components-lib/src/hooks/useGeocoder";
import useClimateZoneHighlighter from "../../utils/useClimateZoneHighlighter";
import WarmingScenarioSelection from "../WarmingScenarioSelection";
import Popup from "../common/Popup";
import { useDatasetChangeHandler } from "../../utils/useDatasetChangeHandler";

type MapStyles = {
  stops?: number[];
  binHexColors?: string[];
  climateZoneBinHexColors?: string[];
};

type LinkProps = {
  bottom?: string;
};

const Container = styled.div`
  position: relative;
  overflow: hidden;

  #map-header {
    display: flex;
  }

  .mapboxgl-map {
    font: unset;
  }

  .mapboxgl-ctrl-attrib-inner a {
    font-size: 12px;
    font-family: Helvetica Neue, Arial, Helvetica, sans-serif;
    line-height: 20px;
  }

  .mapboxgl-ctrl-attrib-button {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    justify-content: center;
    align-items: center;

    @media (min-width: ${size.tablet}) {
      display: none;
    }
  }

  .mapboxgl-ctrl-attrib.mapboxgl-compact {
    margin-bottom: 5px;
  }

  .mapboxgl-ctrl-bottom-left {
    bottom: ${consts.HEADER_HEIGHT_MOBILE};
    left: unset;
    right: 45px;

    // Mapbox Breakpoint
    @media (min-width: 641px) {
      right: 10px;
      bottom: 58px;

      .mapboxgl-ctrl {
        margin-bottom: 23px;
      }
    }

    @media (min-width: ${size.laptop}) {
      bottom: 15px;
      left: unset;
      right: 10px;

      .mapboxgl-ctrl {
        margin-bottom: 10px;
      }
    }
  }

  .mapboxgl-ctrl-bottom-right {
    right: 0;
    bottom: 0;

    @media (max-width: ${size.laptop}) {
      bottom: 52px;
    }

    @media (max-width: 641px) {
      bottom: ${consts.HEADER_HEIGHT_MOBILE};
    }

    @media (min-width: ${size.laptop}) {
      right: 0;
      bottom: 0;
    }
  }

  .mapbox-improve-map {
    ${({ isScreenshot }: { isScreenshot: boolean }) => isScreenshot && "display: none"};
    font-weight: 700;
  }
`;

const Link = styled.a`
  position: absolute;
  left: 0;
  padding: 0 5px;
  background-color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-family: Helvetica Neue, Arial, Helvetica, sans-serif;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.75);

  z-index: 1;
  transition: z-index 0.2s step-end;
  cursor: pointer;
  text-decoration: none;
  bottom: ${({ bottom }: LinkProps) => bottom ?? 0};
`;

const MapKeyContainer = styled.div`
  position: absolute;
  top: ${consts.HEADER_HEIGHT};
  right: 0;
  left: 0;
  z-index: 1;
  min-width: 280px;

  @media (min-width: ${size.tablet}) and (max-width: ${size.tabletMax}) {
    top: 0;
    z-index: 3;
    right: unset
    width: auto;
    left: 406px;
  }

  @media (min-width: ${size.laptop}) {
    top: unset;
    right: unset;
    left: 10px;
    bottom: 36px;
    z-index: 2;
    width: auto;
  }

  .map-key-container {
    border-top: 1px solid ${colors.darkPurple};
    overflow-x: auto;

    @media (min-width: ${size.tablet}) and (max-width: ${size.tabletMax}) {
      padding: 0px 18px;
      border-bottom: 1px solid ${colors.grey};
      border-top: none;
      height: 62px;
      overflow: hidden !important;
    }

    @media (min-width: ${size.laptop}) {
      border: 1px solid ${colors.grey};
      border-radius: 6px;
      padding: 12px 18px 9px;
      overflow: hidden !important;
    }

    ::-webkit-scrollbar {
      display: none !important;
    }
  }

  .climate-zones-key-container {
    width: 100vw;
    overflow-x: scroll; /* Add the ability to scroll */
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
    overflow-y: hidden;
    white-space: nowrap;
    padding: 10px;
    padding-left: 15px;
    border: none;
    box-sizing: content-box;
    border-top: 1px solid ${colors.darkPurple};
    border-bottom: 1px solid ${colors.grey};

    @media (min-width: ${size.tablet}) and (max-width: ${size.tabletMax}) {
      border: 1px solid ${colors.grey};
      padding: 0px;
      padding-left: 16px;
      width: auto;
      height: 61px;
    }

    @media (min-width: ${size.laptop}) {
      border: 1px solid ${colors.grey};
      padding: 0px;
      padding-left: 16px;
      width: auto;
      height: 80px;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar {
      display: none;
    }
  }
`;

const defaultViewState = {
  zoom: consts.INITIAL_ZOOM,
  longitude: 0,
  latitude: 0,
  pitch: 0,
  bearing: 0,
};

const InteractiveMap = () => {
  const [viewState, setViewState] = useState<Partial<ViewState>>(
    () => consts.getInitialMapViewState(window.location.hash.replace("#", "")) || defaultViewState,
  );
  const [isScreenshot, setIsScreenshot] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showDownloadMapModal, setShowDownloadMapModal] = useState(false);

  const mapRef = useRef<MapRef>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const {
    selectedDataset,
    degrees,
    tempUnit,
    datasets,
    setTempUnit,
    showBaselineModal,
    setShowBaselineModal,
    showDescriptionModal,
    setShowDescriptionModal,
    warmingScenarioDescs,
    datasetDescriptionResponse,
    searchIsOpen,
    mapProjection,
    setSearchIsOpen,
    setActiveClimateZoneLayers,
    activeClimateZoneLayers,
    precipitationUnit,
    showCountryBorders,
    showAboutMap,
    showAllMapsModal,
    setShowAboutMap,
    setPrecipitationUnit,
    setDatasets,
    setSelectedDataset,
    setDegrees,
    setMapProjection,
    setWarmingScenarioDescs,
    setWpDatasetDescriptionResponse,
    setShowAllMapsModal,
    aboutMapResources,
    setAboutMapResources,
  } = useMapData();
  const {
    isTourActive,
    step,
    steps,
    closedTour,
    setClosedTour,
    inspectPromptLocation,
    onClose,
    onNext,
    setInspectPromptLocation,
    setSteps,
    setIsTourActive,
  } = useTourData();
  const { popupVisible, setPopupVisible, feature, setPopupFeature } = useFeaturePopup(degrees);
  const mapStyles = useRef<MapStyles>({});
  const windowHeight = useWindowHeight();
  const isLaptop = useMediaQuery({
    query: `(min-width: ${size.laptop})`,
  });
  const [searchResult, setSearchResult] = useState<Feature>();
  const { translate, locale } = useTranslation();

  useMapsApi({
    datasets,
    setDatasets,
    setSelectedDataset,
    setDegrees,
    setMapProjection,
  });
  useWPApi({
    selectedDataset,
    warmingScenarioDescs,
    setSelectedDataset,
    setWarmingScenarioDescs,
    setWpDatasetDescriptionResponse,
    setInspectPromptLocation,
    setSteps,
    setAboutMapResources,
    locale,
  });
  const { climateZoneBinHexColors } = useClimateZoneHighlighter({
    degrees,
    map: mapRef?.current?.getMap(),
    activeClimateZoneLayers,
    datasetDescriptionResponse,
    binHexColors: selectedDataset?.binHexColors,
    bins: selectedDataset?.stops,
    setActiveClimateZoneLayers,
  });

  const { drawGlobeLines, removeGlobeLayers } = useGlobeLines(mapProjection, mapRef.current);
  const onDatasetChange = useDatasetChangeHandler();

  const mapboxAccessToken =
    window.pfInteractiveMap?.mapboxAccessToken || process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

  const showHeader = true;

  const translatedHeader = translate("header");

  const updateMapStyles = useCallback(
    (map: MapBoxMap, degrees: number, where: boolean) => {
      if (mapStyles.current.binHexColors && mapStyles.current.stops) {
        const { binHexColors, stops } = mapStyles.current;
        const { layers } = map.getStyle();
        const lang = locale === "zh" ? "zh-Hans" : locale;

        // Change color for water
        map.setPaintProperty("water", "fill-color", colors.whiteSmoke);
        // Show place labels and set the corresponding language
        map.setLayerZoomRange("country-label", 3, 10);
        [
          "country-label",
          "state-label",
          "settlement-subdivision-label",
          "settlement-minor-label",
          "settlement-major-label",
        ].forEach((layerId) => {
          map.setLayoutProperty(layerId, "text-field", ["get", `name_${lang}`]);
          map.setLayoutProperty(layerId, "visibility", "visible");
        });
        const dataLayerPaintProperties = utils.getMapLayerColors(binHexColors, stops, degrees);

        // Set paint properties for data layers
        layers.forEach(({ id }: { id: string }) => {
          if (id.includes(consts.DATA_LAYER_ID_PREFIX)) {
            map.setPaintProperty(id, "fill-color", dataLayerPaintProperties);
            map.setPaintProperty(id, "fill-antialias", ["step", ["zoom"], false, 6, true]);
            map.setPaintProperty(id, "fill-outline-color", colors.whiteOriginal);
          } else if (id.includes("boundary")) {
            map.setLayoutProperty(id, "visibility", showCountryBorders ? "visible" : "none");
          }
        });
      }
    },
    [locale, showCountryBorders],
  );

  const onExportSimpleMapClick = async () => {
    if (!selectedDataset || !datasetDescriptionResponse) {
      return;
    }

    const template = await generateEmbedMap({
      dataset: selectedDataset,
      tempUnit,
      scenario: degrees,
      viewState:
        consts.getInitialMapViewState(window.location.hash.replace("#", "")) || defaultViewState,
      datasetDescriptionResponse,
      precipitationUnit,
      showBorders: showCountryBorders,
    });
    const fileBlob = new Blob([template], { type: "text/html" });
    downloadFile(fileBlob, `${selectedDataset.name} at ${degreeToString(degrees)}°C`);
  };

  const onExportCompareMapConfirm = async (selectedDegrees: number[]) => {
    if (!selectedDataset || !datasetDescriptionResponse) {
      return;
    }
    const template = await generateEmbedMap({
      dataset: selectedDataset,
      tempUnit,
      scenario: degrees,
      viewState,
      datasetDescriptionResponse,
      compare: {
        scenarioBefore: selectedDegrees[0],
        scenarioAfter: selectedDegrees[1],
      },
      precipitationUnit,
      showBorders: showCountryBorders,
    });
    const fileBlob = new Blob([template], { type: "text/html" });

    downloadFile(
      fileBlob,
      `${selectedDataset.name} comparing ${degreeToString(
        selectedDegrees[0],
      )}°C and ${degreeToString(selectedDegrees[1])}°C`,
    );
  };

  useEffect(() => {
    const handleHashChange = () => {
      const newHash = window.location.hash.replace("#", "");
      const [zoom, latitude, longitude] = newHash.split("/");
      setViewState((viewState) => {
        const newViewState = { ...viewState };
        newViewState.zoom = Number.isNaN(zoom) ? viewState.zoom : Number(zoom);
        newViewState.longitude = Number.isNaN(longitude) ? viewState.longitude : Number(longitude);
        newViewState.latitude = Number.isNaN(latitude) ? viewState.latitude : Number(latitude);
        return newViewState;
      });
    };

    window.addEventListener("hashchange", handleHashChange, false);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      updateMapStyles(map, degrees, false);
    }
  }, [degrees, updateMapStyles]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    let styleLoadCallback: () => void;
    if (map && selectedDataset) {
      styleLoadCallback = () => updateMapStyles(map, degrees, true);
      map.on("style.load", styleLoadCallback);
    }

    return () => {
      if (map && selectedDataset) {
        map.off("style.load", styleLoadCallback);
      }
    };
  }, [degrees, selectedDataset, updateMapStyles]);

  useEffect(() => {
    if (selectedDataset) {
      setPopupVisible(false);
      mapStyles.current = {
        stops: selectedDataset.stops,
        binHexColors: activeClimateZoneLayers?.length
          ? climateZoneBinHexColors
          : selectedDataset.binHexColors,
      };
    }
  }, [activeClimateZoneLayers?.length, climateZoneBinHexColors, selectedDataset, setPopupVisible]);

  useEffect(() => {
    if (mapProjection.name === "globe" && mapRef.current) {
      drawGlobeLines();
    } else if (mapRef.current) {
      removeGlobeLayers();
    }
  }, [mapProjection, drawGlobeLines, removeGlobeLayers]);

  useEffect(() => {
    if (selectedDataset && mapRef.current && mapProjection.name === "globe") {
      const map = mapRef.current.getMap();
      const handleStyleLoad = () => {
        drawGlobeLines();
      };
      map.on("style.load", handleStyleLoad);

      return () => {
        map.off("style.load", handleStyleLoad);
      };
    }
  }, [selectedDataset, mapProjection, removeGlobeLayers, drawGlobeLines]);

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      // @ts-ignore
      if (e.originalEvent?.target?.className !== "mapboxgl-canvas") {
        return;
      }

      setPopupFeature({
        features: e.features,
        lngLat: [e.lngLat.lng, e.lngLat.lat],
      });
    },
    [setPopupFeature],
  );

  const tourInspectorLocation = useMemo(() => {
    const lng = inspectPromptLocation?.latitude_longitude?.lng;
    const lat = inspectPromptLocation?.latitude_longitude?.lat;
    if (lng && lat) {
      return [lng, lat] as [number, number];
    }
    return POPUP_DEFAULT_LOCATION;
  }, [inspectPromptLocation]);

  useEffect(() => {
    if (isTourActive) {
      if (step === 1) {
        mapRef.current?.flyTo({
          center: [tourInspectorLocation[0], tourInspectorLocation[1]],
          zoom: 6,
          duration: 1500,
        });
      } else if (step === 2) {
        setPopupVisible(false);
      }
    }
  }, [isTourActive, step, setPopupVisible, tourInspectorLocation]);

  useEffect(() => {
    if (closedTour) {
      mapRef.current?.flyTo({
        center: [0, 0],
        duration: 1500,
        zoom: 0,
      });
      setClosedTour(false);
    }
  }, [closedTour, setClosedTour]);

  useEffect(() => {
    if (isTourActive && step === 1 && mapRef.current) {
      const map = mapRef.current.getMap();
      setTimeout(() => {
        const point = map.project(tourInspectorLocation);
        const features = map.queryRenderedFeatures([point.x, point.y]);
        setPopupFeature({
          features: features,
          lngLat: [tourInspectorLocation[0], tourInspectorLocation[1]],
        });
      }, 2000);
    }
  }, [isTourActive, step, setPopupFeature, tourInspectorLocation]);

  useEffect(() => {
    setActiveClimateZoneLayers(undefined);
  }, [selectedDataset, setActiveClimateZoneLayers]);

  const changeZoom = (zoom: number) => {
    if (viewState.longitude !== undefined && viewState.latitude !== undefined) {
      mapRef.current?.flyTo({
        center: [viewState.longitude, viewState.latitude],
        zoom,
        duration: 300,
      });
    }
  };

  const takeScreenshot = () => {
    setIsScreenshot(true);
    exportComponentAsPNG(
      mapContainerRef,
      `Probable Futures map - ${selectedDataset?.name} at ${utils.degreeToString(degrees)}°C`,
    );
    // Wait 1s for export to finish
    setTimeout(() => setIsScreenshot(false), 1000);
    trackEvent("Map screenshot", {
      props: {
        map: `${selectedDataset?.name}`,
        zoom: `${viewState?.zoom}`,
        coordinates: `${viewState.latitude},${viewState.longitude}`,
      },
    });
  };

  const generateQRCodeDataURL = async (url: string): Promise<string> => {
    try {
      const canvas = await qrCode.toCanvas(url, { width: 400 });
      const pngDataUrl = canvas.toDataURL("image/png");
      return pngDataUrl;
    } catch (error) {
      throw new Error("Error generating QR code: " + error);
    }
  };

  const onDownloadQRCode = async (url: string) => {
    try {
      const qrCodeDataURL = await generateQRCodeDataURL(url);
      const a = document.createElement("a");
      a.href = qrCodeDataURL;
      a.download = `Probable Futures QR code for ${selectedDataset?.name} at ${utils.degreeToString(
        degrees,
      )}°C.png`;
      a.click();
    } catch (error) {
      console.error(error);
    }
  };

  const mapHeight = useMemo(() => {
    if (windowHeight) {
      return window.pfInteractiveMap ? windowHeight - 55 : windowHeight;
    }
    return window.pfInteractiveMap ? "calc(100vh - 55px)" : "100vh";
  }, [windowHeight]);

  const searchPopup = useMemo(() => {
    if (searchResult) {
      const placeName = searchResult.place_name.split(",");
      const title = placeName[0];
      const address = placeName.splice(1, placeName.length).join(",");
      return (
        <SearchPopup
          longitude={searchResult.geometry.coordinates[0]}
          latitude={searchResult.geometry.coordinates[1]}
          title={title}
          description={address}
          onClose={() => setSearchResult(undefined)}
        />
      );
    }
  }, [searchResult]);

  const onMove = useCallback((evt: ViewStateChangeEvent) => setViewState(evt.viewState), []);

  const mapStyleLink = useMemo(() => {
    if (selectedDataset) {
      const styleBaseURL = `mapbox://styles/${process.env.REACT_APP_MAPBOX_ACCOUNT}`;
      return `${styleBaseURL}/${selectedDataset.mapStyleId}`;
    }
    return "";
  }, [selectedDataset]);

  const onLoad = useCallback(
    (e: MapboxEvent) => {
      if (e.target.isStyleLoaded()) {
        updateMapStyles(e.target, degrees, false);
      }
    },
    [degrees, updateMapStyles],
  );

  const handleTourClick = () => {
    setShowAboutMap(false);
    setTimeout(() => {
      setIsTourActive(true);
    }, 200);
    trackEvent("Map tour started", {
      props: {
        map: `${selectedDataset?.name}`,
      },
    });
  };

  const onSourceData = (e: MapSourceDataEvent) => e.tile && setShowLoader(true);

  const onIdle = () => setShowLoader(false);

  const renderBottomLinks = () => {
    if (!selectedDataset) {
      return null;
    }
    if (isScreenshot) {
      return <Link>{`Probable Futures map v${selectedDataset.mapVersion}`}</Link>;
    }
    return (
      <Link
        bottom={isLaptop ? "0" : `${parseInt(consts.HEADER_HEIGHT_MOBILE) + 2}px`}
        target="_blank"
        rel="noopener noreferrer"
        href={consts.MAP_VERSION_URL}
      >{`Probable Futures map v${selectedDataset.mapVersion}`}</Link>
    );
  };

  const onFly = useCallback((feature: Feature) => {
    setTimeout(() => setSearchResult(feature), 1000);
  }, []);

  const activateClimateZoneLayer = useCallback(
    (layers: string[] | undefined) => {
      setActiveClimateZoneLayers(layers);
    },
    [setActiveClimateZoneLayers],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceActivateClimateZoneLayer = useCallback(debounce(activateClimateZoneLayer, 700), [
    activateClimateZoneLayer,
  ]);

  useEffect(() => {
    return () => debounceActivateClimateZoneLayer.cancel();
  }, [debounceActivateClimateZoneLayer, selectedDataset]);

  const showKey =
    !!datasetDescriptionResponse &&
    (selectedDataset?.dataset.unit === "class"
      ? !!datasetDescriptionResponse.climate_zones
      : !!datasetDescriptionResponse);

  return (
    <contexts.ThemeProvider theme="light">
      <Container
        isScreenshot={isScreenshot}
        style={{
          backgroundColor: mapProjection.name === "globe" ? "rgb(176, 176, 176)" : "initial",
        }}
      >
        <div ref={mapContainerRef}>
          <components.Loader show={showLoader} />
          {showHeader && <MapSelection />}
          {showHeader && <WarmingScenarioSelection />}
          <MapKeyContainer id="map-key">
            {showKey && (
              <components.MapKey
                selectedDataset={selectedDataset}
                tempUnit={tempUnit}
                setTempUnit={setTempUnit}
                mapKeyText={{ ...translate("key"), ...{ datasets: translatedHeader?.datasets } }}
                datasetDescriptionResponse={datasetDescriptionResponse!}
                activateClimateZoneLayer={debounceActivateClimateZoneLayer}
                activeClimateZoneLayers={activeClimateZoneLayers}
                precipitationUnit={precipitationUnit}
                setPrecipitationUnit={setPrecipitationUnit}
                onAboutMapClick={() => setShowAboutMap(true)}
                translatedHeader={translatedHeader}
              />
            )}
          </MapKeyContainer>
          {selectedDataset && (
            <MapGL
              {...viewState}
              mapboxAccessToken={mapboxAccessToken}
              style={{ width: "100vw", height: mapHeight }}
              minZoom={consts.MIN_ZOOM}
              maxZoom={consts.MAX_ZOOM}
              preserveDrawingBuffer={true}
              hash={true}
              onClick={onMapClick}
              ref={mapRef}
              interactiveLayerIds={consts.interactiveClimateLayerIds}
              onMove={onMove}
              mapStyle={mapStyleLink}
              onLoad={onLoad}
              onSourceData={onSourceData}
              onIdle={onIdle}
              projection={mapProjection}
              fog={{
                color: "rgb(176, 176, 176)",
                //@ts-ignore
                "high-color": "rgb(176, 176, 176)", // Upper atmosphere
                "horizon-blend": 0.02, // Atmosphere thickness (default 0.2 at low zooms)
                "space-color": "rgb(176, 176, 176)", // Background color
                "star-intensity": 0, // Background star brightness (default 0.35 at low zoooms )
              }}
            >
              {popupVisible && datasetDescriptionResponse && (
                <Popup feature={feature} onClose={() => setPopupVisible(false)}>
                  <components.PopupContent
                    feature={feature}
                    dataset={selectedDataset}
                    degreesOfWarming={degrees}
                    tempUnit={tempUnit}
                    onReadMoreClick={() => setShowDescriptionModal((show: boolean) => !show)}
                    onBaselineClick={() => setShowDescriptionModal((show: boolean) => !show)}
                    showInspector={false}
                    datasetDescriptionResponse={datasetDescriptionResponse}
                    precipitationUnit={precipitationUnit}
                    mapPopoverText={translate("mapPopover")}
                    keyText={translate("key")}
                  />
                </Popup>
              )}

              <components.Geocoder
                searchInputHeight={consts.SEARCH_INPUT_HEIGHT}
                serverErrorText={translate("geocoder.serverError")}
                noResultText={translate("geocoder.noResult")}
                placeholderText={translate("geocoder.placeholder")}
                clearText={translate("geocoder.clear")}
                recentlySearchedText={translate("geocoder.recentlySearched")}
                searchIsOpen={isLaptop || searchIsOpen}
                autoFocus={!isLaptop && searchIsOpen}
                localStorageRecentlySearchedIemskey={
                  consts.LOCAL_STORAGE_RECENTLY_SEARCHED_ITEMS_KEY
                }
                setSearchIsOpen={setSearchIsOpen}
                mapRef={mapRef}
                mapboxAccessToken={mapboxAccessToken}
                top="115px"
                onFly={onFly}
                language={locale}
              />
              {renderBottomLinks()}
              {searchPopup}
            </MapGL>
          )}
        </div>
        <MapControls
          zoom={viewState.zoom || consts.MIN_ZOOM}
          maxZoom={consts.MAX_ZOOM}
          onZoom={changeZoom}
          onDownloadClick={() => setShowDownloadMapModal(true)}
          onTakeScreenshot={takeScreenshot}
          selectedDataset={selectedDataset}
          onDownloadQRCode={onDownloadQRCode}
          onExportSimpleMapClick={onExportSimpleMapClick}
        />
        {isTourActive && step === 1 && (
          <components.TourBox
            showContentOnly={true}
            onClose={onClose}
            onNext={onNext}
            step={step}
            steps={steps}
            isTourActive={isTourActive}
          />
        )}
        <components.MapModal
          isVisible={showDescriptionModal}
          onToggle={() => setShowDescriptionModal((show: boolean) => !show)}
        >
          {datasetDescriptionResponse && (
            <components.MapDescription
              datasetDescriptionResponse={datasetDescriptionResponse}
              selectedDataset={selectedDataset}
            />
          )}
        </components.MapModal>
        <components.MapModal
          isVisible={showBaselineModal}
          onToggle={() => setShowBaselineModal((show: boolean) => !show)}
        >
          <div
            style={{
              marginTop: "25px",
              padding: "0px 40px 15px",
            }}
          >
            <p
              dangerouslySetInnerHTML={{
                __html: warmingScenarioDescs.description_baseline_change_maps || "",
              }}
            ></p>
          </div>
        </components.MapModal>
        <DownloadMapModal
          isVisible={showDownloadMapModal}
          onClose={() => setShowDownloadMapModal((show: boolean) => !show)}
          onExportCompareMap={onExportCompareMapConfirm}
          selectedDataset={selectedDataset}
        />
        <components.AboutMap
          isOpen={showAboutMap}
          datasetDescriptionResponse={datasetDescriptionResponse}
          warmingScenarioDescs={warmingScenarioDescs}
          onClose={() => setShowAboutMap(false)}
          datasets={datasets}
          translatedHeader={translatedHeader}
          selectedDataset={selectedDataset}
          aboutMapResources={aboutMapResources}
          onDatasetChange={onDatasetChange}
          handleTourClick={handleTourClick}
          source="maps"
        />
        {selectedDataset && (
          <components.AllMapsModal
            value={{
              value: selectedDataset.slug || "",
              label:
                (translatedHeader?.datasets || {})[camelcase(selectedDataset.slug)] ||
                selectedDataset.name,
            }}
            datasets={datasets}
            translatedDatasets={translatedHeader?.datasets}
            isVisible={showAllMapsModal}
            onClose={() => setShowAllMapsModal(false)}
            onChange={onDatasetChange}
            allMapsTitle={translate("allMapsModal.title")}
            closeText={translate("close.text")}
          />
        )}
      </Container>
    </contexts.ThemeProvider>
  );
};

export default InteractiveMap;
