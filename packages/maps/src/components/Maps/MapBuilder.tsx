import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MapGL, {
  NavigationControl,
  MapRef,
  ViewState,
  MapLayerMouseEvent,
  ViewStateChangeEvent,
} from "react-map-gl";
import styled from "styled-components";
import { components } from "@probable-futures/components-lib";
import { utils, consts, types } from "@probable-futures/lib";
import camelcase from "lodash.camelcase";
import mapboxgl, { MapboxEvent, Map } from "mapbox-gl";

import { useMenu } from "../Menu";
import Popup from "../common/Popup";
import { setQueryParam } from "../../utils";
import useFeaturePopup from "../../utils/useFeaturePopup";
import PlusIcon from "../../assets/icons/plus.svg";
import MinusIcon from "../../assets/icons/minus.svg";
import MapBuilderHeader from "../MapBuilderHeader";
import { colors, size } from "../../consts";
import { getMapBuilderMinZoom, LATEST_MAP_VERSION } from "../../consts/mapConsts";
import { getDiffMapBinHexColors } from "../../consts/versionDiffMaps";
import { ERA5_MAX_DEGREES, isEra5Map } from "../../consts/era5Maps";
import { isLatestMapForSlug } from "../../utils/mapSelection";
import { getComparisonSideLabel } from "../../utils/mapVersions";
import useActiveDiffMap, { getActiveMapStyleId } from "../../utils/useActiveDiffMap";
import useActiveEra5Map from "../../utils/useActiveEra5Map";
import { useTranslation } from "../../contexts/TranslationContext";
import useGlobeLines, { LINE_LAYER_LABEL_PREFIX } from "../../utils/useGlobeLines";
import VersionComparisonMapView, { VersionComparisonMapHandle } from "./VersionComparisonMapView";
import DiffMapKey from "./DiffMapKey";
import DiffPopupContent from "./DiffPopupContent";

const DEFAULT_MAX_DEGREES = 3;

const Container = styled.div`
  position: relative;
  overflow: hidden;

  .mapboxgl-map {
    font: unset;
  }

  .mapboxgl-ctrl-bottom-left {
    bottom: 15px;
    left: unset;
    right: 10px;
  }

  .mapboxgl-ctrl-group {
    border-radius: 0;
    box-shadow: none;
    border: 1px solid #aaaaaa;
    button + button {
      border-top: 1px solid #aaaaaa;
    }
  }
  .mapboxgl-ctrl {
    button {
      &.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon {
        background-image: url(${PlusIcon});
      }
      &.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon {
        background-image: url(${MinusIcon});
      }
    }
  }

  .mapboxgl-ctrl-top-right {
    position: absolute;
    right: 16px;
    top: 55px;
  }
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

  @media (max-width: ${size.desktop}) {
    ${({ sidebarOpen, unit }: { sidebarOpen: boolean; unit?: string }) =>
      sidebarOpen && unit === "class" && `flex-direction: column-reverse;`}
  }

  .map-key-container,
  .climate-zones-key-container {
    border: 1px solid ${colors.darkPurple};
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0px;
    padding-left: 16px;
    min-height: 90px;
  }

  .map-key-container {
    padding-right: 16px;
  }

  .diff-map-key-container {
    border: 1px solid ${colors.darkPurple};
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 14px 22px;
    min-height: 104px;
  }
`;

const StyleErrorBanner = styled.div`
  position: absolute;
  top: 64px;
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
      setMidValueShown,
      comparisonMode,
      comparisonRestored,
      versionBefore,
      versionAfter,
    },
    mapStyle: {
      landColor,
      oceanColor,
      showBoundaries,
      showLabels,
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
    landColor,
    oceanColor,
    showBoundaries,
    showLabels,
  });
  const { translate } = useTranslation();
  const { drawGlobeLines, removeGlobeLayers } = useGlobeLines(mapProjection, mapRef.current);
  const [hasStyleError, setHasStyleError] = useState(false);

  const activeDiffMap = useActiveDiffMap();
  const activeEra5Map = useActiveEra5Map();

  /** True whenever an ERA5 map is on screen, on its own or as a comparison side. */
  const era5Active =
    !!activeEra5Map ||
    (comparisonMode === "swipe" && (isEra5Map(versionBefore) || isEra5Map(versionAfter)));

  const maxDegrees = era5Active ? ERA5_MAX_DEGREES : DEFAULT_MAX_DEGREES;

  // ERA5 tiles have no properties above 1°C, so a higher level would paint the
  // map blank rather than merely look wrong.
  useEffect(() => {
    if (era5Active && degrees > ERA5_MAX_DEGREES) {
      setDegrees(ERA5_MAX_DEGREES);
      setQueryParam({ warmingScenario: ERA5_MAX_DEGREES });
    }
  }, [era5Active, degrees, setDegrees]);

  const updateMapStyles = useCallback((map: Map) => {
    if (mapGeneralStyles.current.binHexColors && mapGeneralStyles.current.bins) {
      const { layers } = map.getStyle();
      const {
        current: { binHexColors, bins, degrees, landColor, oceanColor, showBoundaries, showLabels },
      } = mapGeneralStyles;
      const dataLayerPaintProperties = utils.getMapLayerColors(binHexColors, bins, degrees);
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
        } else if (id.includes("boundary")) {
          map.setLayoutProperty(id, "visibility", showBoundaries ? "visible" : "none");
        } else if (
          (type === "symbol" || id.includes("road")) &&
          !id.includes(LINE_LAYER_LABEL_PREFIX)
        ) {
          map.setLayoutProperty(id, "visibility", showLabels ? "visible" : "none");
        }
      });
    }
  }, []);

  useEffect(() => {
    mapGeneralStyles.current = {
      bins: dynamicStyleVariables?.bins,
      binHexColors: dynamicStyleVariables?.binHexColors,
      degrees,
      landColor,
      oceanColor,
      showBoundaries,
      showLabels,
    };

    if (mapRef.current && dynamicStyleVariables?.binHexColors && dynamicStyleVariables?.bins) {
      const map = mapRef.current.getMap();
      if (map.isStyleLoaded()) {
        updateMapStyles(map);
      }
    }
  }, [
    degrees,
    landColor,
    oceanColor,
    setPopupVisible,
    showBoundaries,
    showLabels,
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
      setMidValueShown(selectedDataset.methodUsedForMid);
    }
  }, [selectedDataset, setMidValueShown, datasets, filterByStatus]);

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
      setDynamicStyleVariables({
        binHexColors: selectedDataset.binHexColors,
        bins: selectedDataset.stops,
      });
    }
  }, [selectedDataset, activeDiffMap, setDynamicStyleVariables]);

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

  const getMapStyleLink = useCallback((dataset?: types.Map) => {
    if (!dataset) {
      return "";
    }
    const mapboxAccount =
      window.pfInteractiveMap?.mapboxAccount || import.meta.env.VITE_MAPBOX_ACCOUNT;
    return `mapbox://styles/${mapboxAccount}/${dataset.mapStyleId}`;
  }, []);

  const mapStyleLink = useMemo(() => {
    const styleId = getActiveMapStyleId(selectedDataset, activeDiffMap, activeEra5Map);
    if (!styleId) {
      return "";
    }
    const mapboxAccount =
      window.pfInteractiveMap?.mapboxAccount || import.meta.env.VITE_MAPBOX_ACCOUNT;
    return `mapbox://styles/${mapboxAccount}/${styleId}`;
  }, [activeDiffMap, activeEra5Map, selectedDataset]);

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

  return (
    <Container>
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
      {canRenderMap && isComparing && (
        <VersionComparisonMapView
          ref={comparisonMapRef}
          datasetBefore={versionBefore!}
          datasetAfter={versionAfter!}
          labelBefore={getComparisonSideLabel(versionBefore!)}
          labelAfter={getComparisonSideLabel(versionAfter!)}
          mapStyleUrlBefore={getMapStyleLink(versionBefore)}
          mapStyleUrlAfter={getMapStyleLink(versionAfter)}
          mapboxAccessToken={
            window.pfInteractiveMap?.mapboxAccessToken || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
          }
          degrees={degrees}
          bins={dynamicStyleVariables?.bins}
          binHexColors={dynamicStyleVariables?.binHexColors}
          landColor={landColor}
          oceanColor={oceanColor}
          showBoundaries={showBoundaries}
          showLabels={showLabels}
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
          minZoom={getMapBuilderMinZoom(mapProjection.name)}
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
          <NavigationControl showZoom showCompass={false} />
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
      <KeyWrapper sidebarOpen={sidebar.isVisible} unit={selectedDataset?.dataset.unit}>
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
          />
        )}
        <components.DegreeSlider
          degrees={degrees}
          min={0.5}
          max={maxDegrees}
          hint={
            era5Active
              ? translate(
                  "slider.era5DegreesHint",
                  "ERA5 only has observed data for 0.5°C and 1°C.",
                )
              : undefined
          }
          title={translate("slider.title")}
          onChangeCommitted={(e, value) => {
            setDegrees(value);
            setQueryParam({ warmingScenario: value as number });
          }}
          onChange={(e, value) => {
            setDegrees(value);
            setQueryParam({ warmingScenario: value as number });
          }}
        />
      </KeyWrapper>
      <MapBuilderHeader />
    </Container>
  );
};

export default InteractiveMap;
