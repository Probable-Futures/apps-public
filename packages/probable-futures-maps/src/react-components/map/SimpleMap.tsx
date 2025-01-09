import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import MapGL, { MapLayerMouseEvent, MapRef, ViewState, ViewStateChangeEvent } from "react-map-gl";
import styled from "styled-components";
import { MapboxEvent, Map as MapBoxMap } from "mapbox-gl";

import Popup from "./Popup";
import useFeaturePopup from "../utils/useFeaturePopup";
import { size, colors, MIN_ZOOM, MAX_ZOOM, consts, types, utils } from "@probable-futures/lib";
import { climateZonesDescriptions, datasets } from "../../consts";
import Header from "./Header";
import { components } from "@probable-futures/components-lib";
import ResetMap from "./ResetButton";
import MapControls from "./MapControls";
import { MapKeyContainer } from "../../consts/styles";
import MapLink from "./MapLink";
import { SimpleMapProps } from "../utils/types";
import useExternalStylesheets from "../utils/useExternalStylesheets";

type MapStyles = {
  stops?: number[];
  binHexColors?: string[];
  climateZoneBinHexColors?: string[];
};

const Container = styled.div`
  height: 100%;
  min-height: 400px;
  position: relative;
  margin: 0;
  padding: 0;
  font-family: LinearSans, Arial, Helvetica, sans-serif;
  font-size: 16px;
  color: #2a172d;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  #map-header {
    display: flex;
  }

  .mapboxgl-map {
    font: unset;
  }

  .mapboxgl-ctrl-attrib-inner a {
    font-size: 10px;
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
    bottom: 15px;
    left: unset;
    right: 10px;
  }

  .mapboxgl-ctrl-bottom-right {
    position: absolute;
    z-index: 1;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.5);
    padding: 0 10px;
  }

  .mapbox-improve-map {
    font-weight: 700;
  }
`;

const defaultViewState = {
  zoom: consts.INITIAL_ZOOM,
  longitude: 0,
  latitude: 0,
  pitch: 0,
  bearing: 0,
};

const SimpleMap = ({
  dataset,
  datasetId,
  tempUnit = "°C",
  scenario = 1,
  datasetDescriptionResponse = climateZonesDescriptions,
  precipitationUnit = "mm",
  showBorders,
  viewState: viewStateFromProps,
  hideResetMapButton,
  hideControls,
  hideMapLegend,
  hideTitle,
  showPopupOnFirstLoad,
  mapboxAccessToken,
  usePfFonts = true,
  mapStyleUrl,
}: SimpleMapProps) => {
  const selectedDataset =
    dataset ??
    (datasets.find((dataset) => dataset.dataset.id === datasetId && dataset.isLatest) as
      | types.Map
      | undefined);

  if (!selectedDataset) {
    throw Error("Either the dataset or datasetId fields must be valid.");
  }
  if (!mapboxAccessToken) {
    throw Error("Missing mapbox access token.");
  }

  const [viewState, setViewState] = useState<Partial<ViewState>>(
    () => viewStateFromProps || defaultViewState,
  );
  const mapRef = useRef<MapRef>(null);
  const [tempUnitState, setTempUnitState] = useState(tempUnit);
  const [precipitationUnitState, setPrecipitationUnitState] = useState(precipitationUnit);

  const { popupVisible, setPopupVisible, feature, setPopupFeature } = useFeaturePopup(scenario);
  const mapStyles = useRef<MapStyles>({});
  useExternalStylesheets(usePfFonts);

  const updateMapStyles = useCallback(
    (map: MapBoxMap, degrees: number) => {
      if (mapStyles.current.binHexColors && mapStyles.current.stops) {
        const { binHexColors, stops } = mapStyles.current;
        const { layers } = map.getStyle();
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
          map.setLayoutProperty(layerId, "text-field", ["get", "name_en"]);
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
            map.setLayoutProperty(id, "visibility", showBorders ? "visible" : "none");
          }
        });
      }
    },
    [showBorders],
  );

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      updateMapStyles(map, scenario);
    }
  }, [scenario, updateMapStyles]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    let styleLoadCallback: () => void;
    if (map && selectedDataset) {
      styleLoadCallback = () => updateMapStyles(map, scenario);
      map.on("style.load", styleLoadCallback);
    }

    return () => {
      if (map && selectedDataset) {
        map.off("style.load", styleLoadCallback);
      }
    };
  }, [selectedDataset, scenario, updateMapStyles]);

  useEffect(() => {
    if (selectedDataset) {
      setPopupVisible(false);
      mapStyles.current = {
        stops: selectedDataset.stops,
        binHexColors: selectedDataset.binHexColors,
      };
    }
  }, [selectedDataset, setPopupVisible]);

  const onMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
      if (mapStyleUrl) {
        return mapStyleUrl;
      }
      const styleBaseURL = `mapbox://styles/probablefutures`;
      return `${styleBaseURL}/${selectedDataset.mapStyleId}`;
    }
    return "";
  }, [selectedDataset]);

  const onLoad = useCallback(
    (e: MapboxEvent) => {
      if (e.target.isStyleLoaded()) {
        updateMapStyles(e.target, scenario);
        if (e.target && showPopupOnFirstLoad) {
          const point = e.target.project([
            viewStateFromProps.longitude || 0,
            viewStateFromProps.latitude || 0,
          ]);
          const features = e.target.queryRenderedFeatures([point.x, point.y]);
          const event = {
            lngLat: {
              lng: viewStateFromProps.longitude || 0,
              lat: viewStateFromProps.latitude || 0,
            },
            features,
            originalEvent: {
              target: { className: "mapboxgl-canvas" },
            },
          };

          onMapClick(event as unknown as MapLayerMouseEvent);
        }
      }
    },
    [
      onMapClick,
      scenario,
      showPopupOnFirstLoad,
      updateMapStyles,
      viewStateFromProps.latitude,
      viewStateFromProps.longitude,
    ],
  );

  const handleResetMap = () => {
    const lat = viewStateFromProps.latitude || 0;
    const lng = viewStateFromProps.longitude || 0;

    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: viewStateFromProps.zoom || 2.2,
      duration: 1500,
    });
    setTimeout(() => {
      const map = mapRef.current?.getMap(); // Access the native Mapbox map

      if (map) {
        const point = map.project([lng, lat]);
        const features = map.queryRenderedFeatures([point.x, point.y]);
        const event = {
          lngLat: {
            lng,
            lat,
          },
          features,
          originalEvent: {
            target: { className: "mapboxgl-canvas" },
          },
        };

        onMapClick(event as unknown as MapLayerMouseEvent);
      }
    }, 1200);
  };

  const onZoom = (zoom: number) => {
    if (viewState.longitude !== undefined && viewState.latitude !== undefined) {
      mapRef.current?.flyTo({
        center: [viewState.longitude, viewState.latitude],
        zoom,
        duration: 300,
      });
    }
  };

  return (
    <Container>
      {!hideTitle && <Header degrees={scenario} dataset={selectedDataset} showCompare={false} />}
      {!hideMapLegend && (
        <MapKeyContainer id="map-key">
          <components.MapKey
            selectedDataset={selectedDataset}
            tempUnit={tempUnitState}
            setTempUnit={setTempUnitState}
            datasetDescriptionResponse={datasetDescriptionResponse}
            precipitationUnit={precipitationUnitState}
            setPrecipitationUnit={setPrecipitationUnitState}
          />
        </MapKeyContainer>
      )}
      {!hideResetMapButton && <ResetMap onReset={handleResetMap} />}
      {!hideControls && (
        <MapControls
          zoom={viewState.zoom || MIN_ZOOM}
          maxZoom={MAX_ZOOM + 100}
          onZoomIn={() => onZoom((viewState.zoom || MIN_ZOOM) + 1)}
          onZoomOut={() => onZoom((viewState.zoom || MIN_ZOOM) - 1)}
        />
      )}
      {selectedDataset && (
        <MapGL
          {...viewState}
          mapboxAccessToken={mapboxAccessToken}
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
          scrollZoom={false}
          id={`map_${Math.floor(Math.random() * 10000)}`}
          style={{ width: "100%", height: "100%" }}
        >
          {popupVisible && (
            <Popup feature={feature} onClose={() => setPopupVisible(false)}>
              <components.PopupContent
                feature={feature}
                dataset={selectedDataset}
                degreesOfWarming={scenario}
                tempUnit={tempUnitState}
                showInspector={false}
                datasetDescriptionResponse={datasetDescriptionResponse || climateZonesDescriptions}
                precipitationUnit={precipitationUnitState}
              />
            </Popup>
          )}
        </MapGL>
      )}
      <MapLink dataset={selectedDataset} />
    </Container>
  );
};

export default SimpleMap;
