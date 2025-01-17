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
import { utils, consts } from "@probable-futures/lib";
import { MapboxEvent, Map } from "mapbox-gl";

import { useMenu } from "../Menu";
import Popup from "../common/Popup";
import { setQueryParam } from "../../utils";
import useFeaturePopup from "../../utils/useFeaturePopup";
import PlusIcon from "../../assets/icons/plus.svg";
import MinusIcon from "../../assets/icons/minus.svg";
import MapBuilderHeader from "../MapBuilderHeader";
import { colors, size } from "../../consts";
import { useTranslation } from "../../contexts/TranslationContext";
import useGlobeLines, { LINE_LAYER_LABEL_PREFIX } from "../../utils/useGlobeLines";

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
  const {
    sidebar,
    data: {
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
  }, [selectedDataset, setPopupVisible]);

  useEffect(() => {
    if (mapProjection.name !== "mercator" && mapProjection.name !== "globe") {
      const zoom = viewState.zoom;
      if (zoom && zoom < 3) {
        mapRef.current?.setZoom(3);
      }
    }
  }, [mapProjection, viewState.zoom]);

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
    if (selectedDataset) {
      setDynamicStyleVariables({
        binHexColors: selectedDataset.binHexColors,
        bins: selectedDataset.stops,
      });
      setQueryParam({ mapSlug: selectedDataset.slug });
      setMidValueShown(selectedDataset.methodUsedForMid);
    }
  }, [selectedDataset, setDynamicStyleVariables, setMidValueShown]);

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

  return (
    <Container>
      {selectedDataset && (
        <MapGL
          {...viewState}
          mapboxAccessToken={
            window.pfInteractiveMap?.mapboxAccessToken || process.env.REACT_APP_MAPBOX_ACCESS_TOKEN
          }
          style={{ width: "100vw", height: "100vh" }}
          minZoom={
            mapProjection.name === "mercator" || mapProjection.name === "globe"
              ? consts.MIN_ZOOM
              : consts.MIN_ZOOM_3
          }
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
              <components.PopupContent
                feature={feature}
                dataset={selectedDataset}
                degreesOfWarming={degrees}
                showInspector={showInspector}
                tempUnit={tempUnit}
                datasetDescriptionResponse={datasetDescriptionResponse}
                precipitationUnit={precipitationUnit}
              />
            </Popup>
          )}
        </MapGL>
      )}
      <KeyWrapper sidebarOpen={sidebar.isVisible} unit={selectedDataset?.dataset.unit}>
        {showKey && (
          <components.MapKey
            selectedDataset={selectedDataset}
            tempUnit={tempUnit}
            stops={dynamicStyleVariables?.bins}
            binHexColors={dynamicStyleVariables?.binHexColors}
            setTempUnit={setTempUnit}
            mapKeyText={{ ...translate("key"), ...{ datasets: translate("header.datasets") } }}
            datasetDescriptionResponse={datasetDescriptionResponse}
            precipitationUnit={precipitationUnit}
            setPrecipitationUnit={setPrecipitationUnit}
          />
        )}
        <components.DegreeSlider
          degrees={degrees}
          min={0.5}
          max={3}
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
