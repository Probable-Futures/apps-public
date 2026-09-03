import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MapGL, { MapRef, ViewState, MapLayerMouseEvent, ViewStateChangeEvent } from "react-map-gl";
import { useMediaQuery } from "react-responsive";
import styled from "styled-components";
import { components, contexts } from "@probable-futures/components-lib";
import { Feature } from "@probable-futures/components-lib/src/hooks/useGeocoder";
import { utils, consts, types } from "@probable-futures/lib";
import camelcase from "lodash.camelcase";
import mapboxgl, { MapboxEvent, Map } from "mapbox-gl";

import { useMenu } from "../Menu";
import { defaultDegreesForChangeMaps } from "../../contexts/DataContext";
import Popup from "../common/Popup";
import { setQueryParam } from "../../utils";
import useFeaturePopup from "../../utils/useFeaturePopup";
import MapBuilderHeader from "../MapBuilderHeader";
import MapBuilderControls from "../MapBuilderControls";
import CoverageTable from "../CoverageTable";
import { colors, size } from "../../consts";
import {
  getMapBuilderMinZoom,
  LATEST_MAP_VERSION,
  MAP_BUILDER_MAX_ZOOM,
} from "../../consts/mapConsts";
import { exportComponentAsPNG } from "../../utils/export";
import { getDiffMapBinHexColors } from "../../consts/versionDiffMaps";
import { ERA5_MAX_DEGREES, isEra5Map } from "../../consts/era5Maps";
import { getAbsoluteMap, getAbsoluteRamp } from "../../consts/absoluteMaps";
import { isLatestMapForSlug } from "../../utils/mapSelection";
import { getMapValueMode, resolveChangeView } from "../../utils/mapValueMode";
import { getComparisonSideShortLabel } from "../../utils/mapVersions";
import useActiveDiffMap, { getActiveMapStyleId } from "../../utils/useActiveDiffMap";
import useActiveEra5Map from "../../utils/useActiveEra5Map";
import useActiveAbsoluteMap from "../../utils/useActiveAbsoluteMap";
import { useTranslation } from "../../contexts/TranslationContext";
import useGlobeLines, { LINE_LAYER_LABEL_PREFIX } from "../../utils/useGlobeLines";
import VersionComparisonMapView, { VersionComparisonMapHandle } from "./VersionComparisonMapView";
import DiffMapKey from "./DiffMapKey";
import DiffPopupContent from "./DiffPopupContent";

const DEFAULT_MAX_DEGREES = 3;

/** Matches the zoom the shared geocoder uses for a result with no bounding box. */
const SEARCH_RESULT_ZOOM = 10;

const Container = styled.div`
  position: relative;
  overflow: hidden;

  .mapboxgl-map {
    font: unset;
  }

  .mapboxgl-ctrl-attrib,
  .mapboxgl-ctrl-attrib-inner a {
    font-size: 12px;
    font-family: Helvetica Neue, Arial, Helvetica, sans-serif;
    line-height: 20px;
  }

  .mapboxgl-ctrl-bottom-left {
    bottom: 15px;
    left: unset;
    right: 10px;
  }

  .mapbox-improve-map {
    ${({ isScreenshot }: { isScreenshot: boolean }) => isScreenshot && "display: none"};
  }
`;

const WarmingScenarioWrapper = styled.div`
  position: absolute;
  top: 62px;
  right: 10px;
  box-sizing: content-box;
  z-index: 3;
  width: 600px;
`;

const KeyWrapper = styled.div`
  display: flex;
  position: absolute;
  bottom: 30px;
  left: 0;
  z-index: 1;
  transition: transform 0.7s ease;
  gap: 15px;
  transform: ${({ sidebarOpen }: { sidebarOpen: boolean }) =>
    sidebarOpen ? "translateX(272px)" : "translateX(66px)"};

  .map-key-container,
  .climate-zones-key-container,
  .diff-map-key-container {
    background-color: ${colors.white};
    border: 1px solid ${colors.grey};
    border-radius: 6px;
    box-sizing: border-box;
    overflow: hidden;
  }

  .map-key-container {
    padding: 12px 18px 9px;
  }

  .climate-zones-key-container {
    display: flex;
    align-items: center;
    padding: 0 0 0 16px;
    height: 80px;
    overflow-x: hidden;
  }

  .diff-map-key-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 14px 22px;
    min-height: 104px;
  }
`;

/* Below the warming-scenario switcher, which claims the strip under the header. */
const StyleErrorBanner = styled.div`
  position: absolute;
  top: 160px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  max-width: 520px;
  padding: 10px 16px;
  background-color: ${colors.white};
  border: 1px solid ${colors.red};
  border-radius: 6px;
  color: ${colors.darkPurple};
  font-size: 13px;
  line-height: 1.35;
`;

const defaultViewState = {
  zoom: 3.6,
  latitude: 39.0742,
  longitude: 21.8243,
};

const InteractiveMap = () => {
  const [viewState, setViewState] = useState<Partial<ViewState>>(
    () => consts.getInitialMapViewState(window.location.hash.replace("#", "")) || defaultViewState,
  );
  const mapRef = useRef<MapRef>(null);
  const comparisonMapRef = useRef<VersionComparisonMapHandle>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const {
    sidebar,
    data: {
      datasets,
      filterByStatus,
      selectedDataset,
      degrees,
      showInspector,
      tempUnit,
      datasetDescriptionResponse,
      setTempUnit,
      setDegrees,
      precipitationUnit,
      setPrecipitationUnit,
      percentileValue,
      setPercentileValue,
      comparisonMode,
      comparisonRestored,
      versionBefore,
      versionAfter,
      showEra5,
      showAbsolute,
      showCoverage,
      setShowCoverage,
    },
    mapStyle: {
      landColor,
      oceanColor,
      mapProjection,
      dynamicStyleVariables,
      setDynamicStyleVariables,
    },
  } = useMenu();

  const { popupVisible, setPopupVisible, feature, setPopupFeature } = useFeaturePopup(degrees);
  const mapGeneralStyles = useRef({
    bins: dynamicStyleVariables?.bins,
    binHexColors: dynamicStyleVariables?.binHexColors,
    degrees,
    percentileValue,
    landColor,
    oceanColor,
  });
  const { translate, locale } = useTranslation();
  const { drawGlobeLines, removeGlobeLayers } = useGlobeLines(mapProjection, mapRef.current);
  const [hasStyleError, setHasStyleError] = useState(false);
  const [isScreenshot, setIsScreenshot] = useState(false);
  const isLaptop = useMediaQuery({ query: `(min-width: ${size.laptop})` });

  const activeDiffMap = useActiveDiffMap();
  const activeEra5Map = useActiveEra5Map();
  const activeAbsoluteMap = useActiveAbsoluteMap();

  /** True whenever an ERA5 map is on screen, on its own or as a comparison side. */
  const era5Active =
    !!activeEra5Map ||
    (comparisonMode === "swipe" && (isEra5Map(versionBefore) || isEra5Map(versionAfter)));

  const maxDegrees = era5Active ? ERA5_MAX_DEGREES : DEFAULT_MAX_DEGREES;

  /**
   * One resolver decides what is rendered and what the sidebar may offer, so the
   * control and the styles can never disagree.
   */
  const changeView = resolveChangeView({
    comparisonMode,
    selectedDataset,
    versionBefore,
    versionAfter,
    showEra5,
    showAbsolute,
  });

  const showsAbsoluteValues = changeView.mode === "absolute";

  /**
   * Change values are differences from the 0.5°C baseline, so the baseline is not
   * one of their levels. Anything absolute keeps it.
   */
  const showsChangeValues = !showsAbsoluteValues;
  const minDegrees = showsChangeValues ? defaultDegreesForChangeMaps : undefined;

  // ERA5 tiles have no properties above 1°C, so a higher level would paint the
  // map blank rather than merely look wrong.
  useEffect(() => {
    if (era5Active && degrees > ERA5_MAX_DEGREES) {
      setDegrees(ERA5_MAX_DEGREES);
      setQueryParam({ warmingScenario: ERA5_MAX_DEGREES });
    }
  }, [era5Active, degrees, setDegrees]);

  useEffect(() => {
    if (showsChangeValues && degrees < defaultDegreesForChangeMaps) {
      setDegrees(defaultDegreesForChangeMaps);
      setQueryParam({ warmingScenario: defaultDegreesForChangeMaps });
    }
  }, [showsChangeValues, degrees, setDegrees]);

  // These datasets ship a single value per cell, so the warmer/cooler year
  // attributes the paint expression would ask for do not exist on their tiles.
  useEffect(() => {
    if (
      selectedDataset &&
      consts.datasetsWithMidValuesOnly.includes(selectedDataset.dataset.id) &&
      percentileValue !== "mid"
    ) {
      setPercentileValue("mid");
    }
  }, [selectedDataset, percentileValue, setPercentileValue]);

  const updateMapStyles = useCallback((map: Map) => {
    if (mapGeneralStyles.current.binHexColors && mapGeneralStyles.current.bins) {
      const { layers } = map.getStyle();
      const {
        current: { binHexColors, bins, degrees, percentileValue, landColor, oceanColor },
      } = mapGeneralStyles;
      const dataLayerPaintProperties = utils.getMapLayerColors(
        binHexColors,
        bins,
        degrees,
        percentileValue,
      );
      layers!.forEach((layer) => {
        const { id, type } = layer;
        if (id === "land") {
          map.setPaintProperty("land", "background-color", landColor);
        } else if (id === "water") {
          map.setPaintProperty("water", "fill-color", oceanColor);
        } else if (id.includes(consts.DATA_LAYER_ID_PREFIX)) {
          map.setPaintProperty(id, "fill-color", dataLayerPaintProperties);
          map.setPaintProperty(id, "fill-antialias", ["step", ["zoom"], false, 6, true]);
          map.setPaintProperty(id, "fill-outline-color", "#ffffff");
        } else if (
          // Boundaries and place labels are always on; the globe's own graticule
          // labels are excluded because useGlobeLines adds and removes them.
          id.includes("boundary") ||
          ((type === "symbol" || id.includes("road")) && !id.includes(LINE_LAYER_LABEL_PREFIX))
        ) {
          map.setLayoutProperty(id, "visibility", "visible");
        }
      });
    }
  }, []);

  useEffect(() => {
    mapGeneralStyles.current = {
      bins: dynamicStyleVariables?.bins,
      binHexColors: dynamicStyleVariables?.binHexColors,
      degrees,
      percentileValue,
      landColor,
      oceanColor,
    };

    if (mapRef.current && dynamicStyleVariables?.binHexColors && dynamicStyleVariables?.bins) {
      const map = mapRef.current.getMap();
      if (map.isStyleLoaded()) {
        updateMapStyles(map);
      }
    }
  }, [
    degrees,
    percentileValue,
    landColor,
    oceanColor,
    setPopupVisible,
    updateMapStyles,
    selectedDataset,
    dynamicStyleVariables?.bins,
    dynamicStyleVariables?.binHexColors,
  ]);

  useEffect(() => {
    if (mapProjection.name === "globe" && mapRef.current) {
      drawGlobeLines();
    } else {
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

  useEffect(() => {
    if (selectedDataset) {
      setPopupVisible(false);
    }
  }, [selectedDataset, comparisonMode, setPopupVisible]);

  useEffect(() => {
    if (mapProjection.name !== "mercator" && mapProjection.name !== "globe") {
      const zoom = viewState.zoom;
      if (zoom && zoom < 3) {
        mapRef.current?.setZoom(3);
      }
    }
  }, [mapProjection, viewState.zoom]);

  useEffect(() => {
    if (selectedDataset) {
      setQueryParam({
        mapSlug: selectedDataset.slug,
        version: isLatestMapForSlug(datasets, selectedDataset, filterByStatus)
          ? LATEST_MAP_VERSION
          : selectedDataset.mapVersion.toString(),
      });
    }
  }, [selectedDataset, datasets, filterByStatus]);

  // The difference view swaps in the registry's diverging ramp, which keeps the
  // legend editor and the paint expression working on it exactly as they do on a
  // regular map. Leaving the view restores the dataset's own ramp.
  useEffect(() => {
    if (activeDiffMap) {
      setDynamicStyleVariables({
        binHexColors: getDiffMapBinHexColors(activeDiffMap),
        bins: activeDiffMap.stops,
      });
    } else if (selectedDataset) {
      // A change map's own bins run either side of zero, so an absolute rendering
      // has to borrow the ramp from the row that describes absolute values.
      // Only a change row shown absolute needs to borrow a ramp; a row that is
      // already absolute has bins of its own. With no ramp registered the change
      // bins stand in, which paints flat — see `absoluteRamps`.
      const absoluteRamp =
        showsAbsoluteValues && getMapValueMode(selectedDataset) === "change"
          ? getAbsoluteRamp(selectedDataset.dataset.id)
          : undefined;
      setDynamicStyleVariables({
        binHexColors: absoluteRamp?.binHexColors ?? selectedDataset.binHexColors,
        bins: absoluteRamp?.stops ?? selectedDataset.stops,
      });
    }
  }, [selectedDataset, activeDiffMap, showsAbsoluteValues, datasets, setDynamicStyleVariables]);

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      // @ts-ignore
      if (e.originalEvent?.target?.className !== "mapboxgl-canvas") {
        return;
      }

      // `e.features` is filtered by the fixed interactiveLayerIds list. The
      // red/blue styles are authored separately, so their data layers are queried
      // straight off the map instead — the same approach the swipe view takes.
      const features = activeDiffMap
        ? mapRef.current?.getMap().queryRenderedFeatures([e.point.x, e.point.y])
        : e.features;

      setPopupFeature({
        features,
        lngLat: [e.lngLat.lng, e.lngLat.lat],
      });
    },
    [setPopupFeature, activeDiffMap],
  );

  const onMove = useCallback((evt: ViewStateChangeEvent) => setViewState(evt.viewState), []);

  const styleUrl = useCallback((styleId?: string) => {
    if (!styleId) {
      return "";
    }
    const mapboxAccount =
      window.pfInteractiveMap?.mapboxAccount || import.meta.env.VITE_MAPBOX_ACCOUNT;
    return `mapbox://styles/${mapboxAccount}/${styleId}`;
  }, []);

  /** One comparison side, swapped to its absolute rendering when the view is absolute. */
  const getComparisonStyleLink = useCallback(
    (side?: types.Map) => {
      if (side && showsAbsoluteValues && getMapValueMode(side) === "change") {
        const absolute = getAbsoluteMap(side.dataset.id, side.mapVersion);
        if (absolute) {
          return styleUrl(absolute.mapStyleId);
        }
      }
      return styleUrl(side?.mapStyleId);
    },
    [styleUrl, showsAbsoluteValues],
  );

  const mapStyleLink = useMemo(
    () =>
      styleUrl(
        getActiveMapStyleId(selectedDataset, activeDiffMap, activeEra5Map, activeAbsoluteMap),
      ),
    [activeDiffMap, activeEra5Map, activeAbsoluteMap, selectedDataset, styleUrl],
  );

  useEffect(() => {
    setHasStyleError(false);
  }, [mapStyleLink]);

  /**
   * Mapbox reports transient tile failures through the same event, so only an
   * error raised before the style has loaded counts — that is the shape a style
   * id which no longer resolves takes. Scoped to the difference and ERA5 views
   * because theirs are the style ids that come from a hand-maintained registry.
   */
  const onError = useCallback(() => {
    if ((activeDiffMap || activeEra5Map) && !mapRef.current?.getMap().isStyleLoaded()) {
      setHasStyleError(true);
    }
  }, [activeDiffMap, activeEra5Map]);

  const onLoad = useCallback(
    (e: MapboxEvent) => {
      if (e.target.isStyleLoaded()) {
        updateMapStyles(e.target);
      }
      if (mapProjection.name === "globe") {
        drawGlobeLines();
      }
      e.target.on("style.load", () => updateMapStyles(e.target));
    },
    [mapProjection, updateMapStyles, drawGlobeLines],
  );

  const showKey =
    selectedDataset?.dataset.unit === "class" ? !!datasetDescriptionResponse?.climate_zones : true;

  const isComparing = !!(comparisonMode === "swipe" && versionBefore && versionAfter);

  const canRenderMap = !!selectedDataset && comparisonRestored;

  const minZoom = getMapBuilderMinZoom(mapProjection.name);

  // The controls live outside both map views so they survive the swap between
  // them, which means the zoom has to be routed to whichever one is mounted.
  const changeZoom = (zoom: number) => {
    if (isComparing) {
      comparisonMapRef.current?.zoomTo(zoom);
    } else {
      mapRef.current?.zoomTo(zoom, { duration: 300 });
    }
  };

  const takeScreenshot = async () => {
    setIsScreenshot(true);
    // Let the screenshot-only styles paint before html-to-image reads the tree.
    await new Promise((resolve) => setTimeout(resolve, 250));
    const label = activeDiffMap
      ? `difference ${activeDiffMap.baseVersion}-${activeDiffMap.targetVersion}`
      : `${utils.degreeToString(degrees)}°C`;
    try {
      await exportComponentAsPNG(
        mapContainerRef,
        `Probable Futures map builder - ${selectedDataset?.name} at ${label}`,
      );
    } finally {
      setIsScreenshot(false);
    }
  };

  /**
   * The geocoder flies `mapRef` itself, but the side-by-side view is plain
   * mapbox-gl with no `MapRef`, so it is moved through the comparison handle.
   */
  const onSearchFly = useCallback((feature: Feature) => {
    const handle = comparisonMapRef.current;
    if (!handle) {
      return;
    }
    if (feature.bbox) {
      const [west, south, east, north] = feature.bbox;
      handle.fitBounds([
        [west, south],
        [east, north],
      ]);
      return;
    }
    const center = (feature.center ?? feature.geometry?.coordinates) as unknown as
      | [number, number]
      | undefined;
    if (center) {
      handle.flyTo({ center, zoom: SEARCH_RESULT_ZOOM });
    }
  }, []);

  const scenarioHints = [
    showsChangeValues
      ? translate(
          "slider.changeMapBaselineHint",
          "Change maps measure the difference from 0.5°C, so it is not a scenario.",
        )
      : undefined,
    era5Active
      ? translate("slider.era5DegreesHint", "ERA5 only has data for 0.5°C and 1°C.")
      : undefined,
  ].filter(Boolean);

  /* Clears the scenario switcher, which grows by a line for each hint it shows. */
  const searchTop = `${158 + scenarioHints.length * 32}px`;

  return (
    <Container isScreenshot={isScreenshot}>
      {hasStyleError && (
        <StyleErrorBanner role="alert">
          {activeEra5Map
            ? translate(
                "menu.data.era5MapUnavailable",
                "This ERA5 map style could not be loaded from Mapbox. Check that the style id in the ERA5 registry is still published.",
              )
            : translate(
                "menu.data.diffMapUnavailable",
                "This map style could not be loaded from Mapbox. Check that the style id in the difference-map registry is still published.",
              )}
        </StyleErrorBanner>
      )}
      <div ref={mapContainerRef}>
        {canRenderMap && isComparing && (
          <VersionComparisonMapView
            ref={comparisonMapRef}
            datasetBefore={versionBefore!}
            datasetAfter={versionAfter!}
            labelBefore={getComparisonSideShortLabel(versionBefore!)}
            labelAfter={getComparisonSideShortLabel(versionAfter!)}
            mapStyleUrlBefore={getComparisonStyleLink(versionBefore)}
            mapStyleUrlAfter={getComparisonStyleLink(versionAfter)}
            mapboxAccessToken={
              window.pfInteractiveMap?.mapboxAccessToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
            }
            degrees={degrees}
            bins={dynamicStyleVariables?.bins}
            binHexColors={dynamicStyleVariables?.binHexColors}
            percentileValue={percentileValue}
            landColor={landColor}
            oceanColor={oceanColor}
            showInspector={showInspector}
            mapProjection={mapProjection}
            height="100vh"
            viewState={viewState}
            tempUnit={tempUnit}
            precipitationUnit={precipitationUnit}
            datasetDescriptionResponse={datasetDescriptionResponse}
            onMove={(next) => {
              setViewState((prev) => ({ ...prev, ...next }));
              const hash = `${next.zoom.toFixed(2)}/${next.latitude.toFixed(
                6,
              )}/${next.longitude.toFixed(6)}`;
              window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${window.location.search}#${hash}`,
              );
            }}
          />
        )}
        {canRenderMap && !isComparing && (
          <MapGL
            onError={onError}
            mapLib={mapboxgl}
            {...viewState}
            mapboxAccessToken={
              window.pfInteractiveMap?.mapboxAccessToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
            }
            style={{ width: "100vw", height: "100vh" }}
            minZoom={minZoom}
            maxZoom={MAP_BUILDER_MAX_ZOOM}
            preserveDrawingBuffer={true}
            hash={true}
            onMove={onMove}
            onClick={onMapClick}
            ref={mapRef}
            interactiveLayerIds={consts.interactiveClimateLayerIds}
            mapStyle={mapStyleLink}
            onLoad={onLoad}
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
            {popupVisible && (
              <Popup feature={feature} onClose={() => setPopupVisible(false)}>
                {activeDiffMap ? (
                  <DiffPopupContent
                    feature={feature}
                    diffMap={activeDiffMap}
                    dataset={selectedDataset}
                    showInspector={showInspector}
                    yearLabels={translate("mapPopover.year")}
                  />
                ) : (
                  <components.PopupContent
                    feature={feature}
                    dataset={selectedDataset}
                    degreesOfWarming={degrees}
                    showInspector={showInspector}
                    tempUnit={tempUnit}
                    datasetDescriptionResponse={datasetDescriptionResponse}
                    precipitationUnit={precipitationUnit}
                    isExperiment
                  />
                )}
              </Popup>
            )}
          </MapGL>
        )}
        <KeyWrapper sidebarOpen={sidebar.isVisible}>
          {activeDiffMap && selectedDataset && dynamicStyleVariables?.bins && (
            <DiffMapKey
              diffMap={activeDiffMap}
              title={translate(
                `header.datasets.${camelcase(selectedDataset.slug)}`,
                selectedDataset.name,
              )}
              stops={dynamicStyleVariables.bins}
              binHexColors={
                dynamicStyleVariables.binHexColors ?? getDiffMapBinHexColors(activeDiffMap)
              }
            />
          )}
          {showKey && !activeDiffMap && (
            <components.MapKey
              selectedDataset={selectedDataset}
              tempUnit={tempUnit}
              stops={dynamicStyleVariables?.bins}
              binHexColors={dynamicStyleVariables?.binHexColors}
              setTempUnit={setTempUnit}
              mapKeyText={{
                ...translate("key"),
                ...{ datasets: translate("header.datasets"), year: translate("mapPopover.year") },
              }}
              datasetDescriptionResponse={datasetDescriptionResponse}
              precipitationUnit={precipitationUnit}
              setPrecipitationUnit={setPrecipitationUnit}
              percentileValue={percentileValue}
            />
          )}
        </KeyWrapper>
        <MapBuilderHeader />
        {selectedDataset && (
          <contexts.ThemeProvider theme="light">
            <WarmingScenarioWrapper>
              <components.Degrees
                degrees={degrees}
                maxDegrees={maxDegrees}
                minDegrees={minDegrees}
                hint={scenarioHints.join(" ") || undefined}
                showAboutMapLink={false}
                warmingScenarioDescs={{}}
                showBaselineModal={false}
                translatedHeader={translate("header")}
                onWarmingScenarioClick={(value) => {
                  setDegrees(value);
                  setQueryParam({ warmingScenario: value });
                }}
              />
            </WarmingScenarioWrapper>
          </contexts.ThemeProvider>
        )}
      </div>
      {isLaptop && (
        <components.Geocoder
          searchInputHeight={consts.SEARCH_INPUT_HEIGHT}
          serverErrorText={translate("geocoder.serverError")}
          noResultText={translate("geocoder.noResult")}
          placeholderText={translate("geocoder.placeholder")}
          clearText={translate("geocoder.clear")}
          recentlySearchedText={translate("geocoder.recentlySearched")}
          searchIsOpen
          autoFocus={false}
          localStorageRecentlySearchedIemskey={consts.LOCAL_STORAGE_RECENTLY_SEARCHED_ITEMS_KEY}
          setSearchIsOpen={() => {}}
          mapRef={mapRef}
          mapboxAccessToken={
            window.pfInteractiveMap?.mapboxAccessToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
          }
          top={searchTop}
          onFly={onSearchFly}
          language={locale}
        />
      )}
      <components.MapModal
        isVisible={showCoverage}
        size="lg"
        title={translate("menu.data.coverage.title", "What's available")}
        closeText={translate("close.text")}
        onToggle={() => setShowCoverage(false)}
      >
        <CoverageTable datasets={datasets} />
      </components.MapModal>
      <MapBuilderControls
        zoom={viewState.zoom ?? minZoom}
        minZoom={minZoom}
        maxZoom={MAP_BUILDER_MAX_ZOOM}
        selectedDataset={selectedDataset}
        percentileValue={percentileValue}
        onZoom={changeZoom}
        onTakeScreenshot={takeScreenshot}
        setPercentileValue={setPercentileValue}
      />
    </Container>
  );
};

export default InteractiveMap;
