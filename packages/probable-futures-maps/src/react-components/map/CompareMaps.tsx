import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import mapboxgl, { Map } from "mapbox-gl";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Compare from "mapbox-gl-compare";
import styled from "styled-components";
import {
  colors,
  INITIAL_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  consts,
  types,
  utils,
} from "@probable-futures/lib";
import ReactDOM from "react-dom/client";
import { ViewState } from "react-map-gl";

import { components } from "@probable-futures/components-lib";
import { CompareMapProps } from "../utils/types";
import { climateZonesDescriptions, datasets } from "../../consts";
import Header from "./Header";
import { MapKeyContainer, PopupContainerCss } from "../../consts/styles";
import ResetMap from "./ResetButton";
import MapControls from "./MapControls";
import MapLink from "./MapLink";
import useExternalStylesheets from "../utils/useExternalStylesheets";

const Container = styled.div`
  height: 100%;
  ${PopupContainerCss}
`;

const Content = styled.div`
  width: 100%;
  height: 100%;
  margin: 0 auto;
`;

const MapContainer = styled.div<{ scenarioBefore: number; scenarioAfter: number }>`
  position: relative;
  user-select: none;
  height: 100%;

  .mapboxgl-compare {
    background-color: ${colors.darkPurple};
    position: absolute;
    width: 2px;
    height: 100%;
    z-index: 1;
  }

  .mapboxgl-compare .compare-swiper-vertical {
    background-color: ${colors.darkPurple};
    box-shadow: inset 0 0 0 2px ${colors.white};
    display: inline-block;
    border-radius: 50%;
    position: absolute;
    width: 40px;
    height: 40px;
    top: 35%;
    left: -20px;
    margin: -20px 1px 0;
    color: ${colors.white};
    cursor: ew-resize;
    background-repeat: no-repeat, no-repeat;
    background-size: 45px;
    background-position: -2px center, 0px center;

    ::before,
    ::after {
      font-family: "RelativeMono";
      background-color: ${colors.darkPurple};
      border: 1px solid ${colors.white};
      display: block;
      position: absolute;
      top: 10px;
      padding: 2px 0;
      width: 62px;
      text-align: center;
      color: ${colors.lightCream};
      font-size: 15px;
      letter-spacing: 0;
    }

    ::before {
      content: ${({ scenarioBefore }) => `"${scenarioBefore}°C"`};
      left: -71px;
    }

    ::after {
      font-family: "RelativeMono";
      content: ${({ scenarioAfter }) => `"${scenarioAfter}°C"`};
      right: -71px;
    }
  }
`;

const MapDiv = styled.div`
  overflow: hidden;
  position: absolute;
  z-index: 1;
  user-select: none;
  width: 100%;
  height: 100%;
`;

const defaultViewState = {
  zoom: INITIAL_ZOOM,
  longitude: 0,
  latitude: 0,
  pitch: 0,
  bearing: 0,
};

const pfLayerIds = [...consts.interactiveClimateLayerIds, "water"];
const getDataByKey = <T extends types.PopupFeature, U extends keyof T>(feature: T, key: U) =>
  feature ? feature[key] : undefined;

export default function CompareMaps({
  dataset,
  tempUnit = "°C",
  compare,
  datasetId,
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
}: CompareMapProps): JSX.Element {
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

  useEffect(() => {
    if (mapboxAccessToken) {
      mapboxgl.accessToken = mapboxAccessToken;
    }
  }, [mapboxAccessToken]);

  const mapContainer = useRef(null);
  const beforeContainer = useRef<any>(null);
  const afterContainer = useRef<any>(null);
  const beforeMapRef = useRef<Map | null>(null);
  const afterMapRef = useRef<Map | null>(null);
  const [tempUnitState, setTempUnitState] = useState(tempUnit);
  const [precipitationUnitState, setPrecipitationUnitState] = useState(precipitationUnit);
  const [viewState, setViewState] = useState<Partial<ViewState>>(
    () => viewStateFromProps || defaultViewState,
  );
  const [beforeMapIsIdle, setBeforeMapIsIdle] = useState(false);
  const [afterMapIsIdle, setAfterMapIsIdle] = useState(false);
  const [initiallyLoadedInspector, setInitiallyLoadedInspector] = useState(false);
  const [featuresAfter, setFeaturesAfter] = useState<mapboxgl.MapboxGeoJSONFeature[]>();
  const [featuresBefore, setFeaturesBefore] = useState<mapboxgl.MapboxGeoJSONFeature[]>();
  const [{ dataKey: dataKeyBefore }] = consts.degreesOptions.filter(
    (d) => d.value === compare?.scenarioBefore,
  );
  const [{ dataKey: dataKeyAfter }] = consts.degreesOptions.filter(
    (d) => d.value === compare?.scenarioAfter,
  );
  const tempUnitStateRef = useRef(tempUnitState);
  const precipitationUnitStateRef = useRef(precipitationUnitState);

  const { addStylesheet } = useExternalStylesheets(usePfFonts);

  useEffect(() => {
    tempUnitStateRef.current = tempUnitState;
  }, [tempUnitState]);

  useEffect(() => {
    precipitationUnitStateRef.current = precipitationUnitState;
  }, [precipitationUnitState]);

  const dataKeyBeforeRef = useRef(dataKeyBefore);
  const dataKeyAfterRef = useRef(dataKeyAfter);

  useEffect(() => {
    dataKeyBeforeRef.current = dataKeyBefore;
    dataKeyAfterRef.current = dataKeyAfter;
  }, [dataKeyBefore, dataKeyAfter]);

  const getPopupFeature = ({
    features,
    lngLat,
    selectedField,
  }: types.MapEvent & { selectedField: string }) => {
    const [longitude, latitude] = lngLat;
    const dataFeature = features
      ? features.find((feature) => feature.layer.id.includes(consts.DATA_LAYER_ID_PREFIX))
      : undefined;
    return {
      latitude,
      longitude,
      selectedField: selectedField,
      selectedData: {
        mid: getDataByKey(dataFeature?.properties, `${selectedField}_mid`),
        low: getDataByKey(dataFeature?.properties, `${selectedField}_low`),
        high: getDataByKey(dataFeature?.properties, `${selectedField}_high`),
      },
      ...dataFeature?.properties,
    };
  };

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

  const onStyleLoad = useCallback(
    (map: any, dataLayerPaintProperties: (string | number | string[])[]) => {
      if (!map) {
        return;
      }
      const { layers } = map.getStyle();
      layers.forEach(function ({ id, type }: { id: string; type: string }) {
        if (id.includes("region-")) {
          map?.setPaintProperty(id, "fill-color", dataLayerPaintProperties);
          map?.setPaintProperty(id, "fill-antialias", ["step", ["zoom"], false, 6, true]);
          map?.setPaintProperty(id, "fill-outline-color", "#ffffff");
        } else if (type === "symbol" || id.includes("road")) {
          map.setLayoutProperty(id, "visibility", "visible");
        } else if (id.includes("boundary")) {
          map.setLayoutProperty(id, "visibility", showBorders ? "visible" : "none");
        }
      });
    },
    [showBorders],
  );

  const removeMapPopups = useCallback((map: any) => {
    if (map) {
      map._popups.forEach((popup: { remove: () => any }) => popup.remove());
    }
  }, []);

  const handleMapClick = useCallback(
    (
      lngLat: [number, number],
      dataKey: string,
      map: Map | null,
      features?: mapboxgl.MapboxGeoJSONFeature[],
    ) => {
      removeMapPopups(map);
      if (!map) {
        return;
      }
      const container = document.createElement("div");
      const root = ReactDOM.createRoot(container);
      const popupFeature = getPopupFeature({
        features: features,
        lngLat,
        selectedField: dataKey,
      });

      root.render(
        <components.PopupContent
          feature={popupFeature}
          dataset={selectedDataset}
          degreesOfWarming={compare?.scenarioBefore || 1}
          tempUnit={tempUnitStateRef.current}
          showInspector={false}
          datasetDescriptionResponse={datasetDescriptionResponse || climateZonesDescriptions}
          precipitationUnit={precipitationUnitStateRef.current}
        />,
      );

      const popup = new mapboxgl.Popup({ anchor: "top", maxWidth: "none", focusAfterOpen: false })
        .setLngLat(lngLat)
        .setDOMContent(container)
        .addTo(map);

      popup.on("close", function () {
        removeMapPopups(afterMapRef.current);
        removeMapPopups(beforeMapRef.current);
      });
    },
    [compare?.scenarioBefore, selectedDataset, datasetDescriptionResponse, removeMapPopups],
  );

  useEffect(() => {
    const showInspectorOnIdle = () => {
      const lat = viewStateFromProps.latitude || 0;
      const lng = viewStateFromProps.longitude || 0;
      setInitiallyLoadedInspector(true);
      setTimeout(() => {
        beforeMapRef.current?.fire("click", {
          lngLat: { lng, lat },
          point: beforeMapRef.current.project({ lng, lat }),
          originalEvent: {},
        });
      }, 200);
    };
    if (afterMapIsIdle && beforeMapIsIdle && showPopupOnFirstLoad && !initiallyLoadedInspector) {
      showInspectorOnIdle();
    }
  }, [
    beforeMapIsIdle,
    afterMapIsIdle,
    initiallyLoadedInspector,
    showPopupOnFirstLoad,
    viewStateFromProps.latitude,
    viewStateFromProps.longitude,
  ]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (beforeMapRef.current?._popups.length > 0 || afterMapRef.current?._popups.length > 0) {
      handleMapClick(
        [viewState.longitude || 0, viewState.latitude || 0],
        dataKeyBefore,
        beforeMapRef.current,
        featuresBefore,
      );
      handleMapClick(
        [viewState.longitude || 0, viewState.latitude || 0],
        dataKeyAfter,
        afterMapRef.current,
        featuresAfter,
      );
    }
  }, [
    tempUnitState,
    precipitationUnitState,
    removeMapPopups,
    handleMapClick,
    dataKeyAfter,
    dataKeyBefore,
  ]);

  useEffect(() => {
    addStylesheet(
      "mapbox-gl-compare-stylesheet",
      "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-compare/v0.4.0/mapbox-gl-compare.css",
    );
  }, [addStylesheet]);

  useEffect(() => {
    if (beforeMapRef.current) {
      if (beforeMapRef.current.isStyleLoaded()) {
        onStyleLoad(
          beforeMapRef.current,
          utils.getMapLayerColors(
            selectedDataset?.binHexColors || [],
            selectedDataset?.stops || [],
            compare?.scenarioBefore || 1,
          ),
        );
      }
    }
  }, [compare?.scenarioBefore, onStyleLoad]);

  useEffect(() => {
    if (afterMapRef.current) {
      if (afterMapRef.current.isStyleLoaded()) {
        onStyleLoad(
          afterMapRef.current,
          utils.getMapLayerColors(
            selectedDataset?.binHexColors || [],
            selectedDataset?.stops || [],
            compare?.scenarioAfter || 1,
          ),
        );
      }
    }
  }, [compare?.scenarioAfter, onStyleLoad]);

  useEffect(() => {
    const handleStyleLoadBefore = () => {
      onStyleLoad(
        beforeMapRef.current,
        utils.getMapLayerColors(
          selectedDataset?.binHexColors || [],
          selectedDataset?.stops || [],
          compare?.scenarioBefore || 1,
        ),
      );
    };

    const handleStyleLoadAfter = () => {
      onStyleLoad(
        afterMapRef.current,
        utils.getMapLayerColors(
          selectedDataset?.binHexColors || [],
          selectedDataset?.stops || [],
          compare?.scenarioAfter || 2,
        ),
      );
    };

    const beforeMapClickHandler = (e: mapboxgl.MapLayerMouseEvent) => {
      setViewState((prev) => ({ ...prev, latitude: e.lngLat.lat, longitude: e.lngLat.lng }));
      const afterMapFeatures = afterMapRef.current?.queryRenderedFeatures([e.point.x, e.point.y]);
      setFeaturesBefore(e.features);
      setFeaturesAfter(afterMapFeatures);
      handleMapClick([e.lngLat.lng, e.lngLat.lat], dataKeyBefore, beforeMapRef.current, e.features);
      handleMapClick(
        [e.lngLat.lng, e.lngLat.lat],
        dataKeyAfter,
        afterMapRef.current,
        afterMapFeatures,
      );
    };

    const afterMapClickHandler = (e: mapboxgl.MapLayerMouseEvent) => {
      setViewState((prev) => ({ ...prev, latitude: e.lngLat.lat, longitude: e.lngLat.lng }));
      const beforeMapFeatures = afterMapRef.current?.queryRenderedFeatures([e.point.x, e.point.y]);
      setFeaturesAfter(e.features);
      setFeaturesBefore(beforeMapFeatures);
      handleMapClick([e.lngLat.lng, e.lngLat.lat], dataKeyAfter, afterMapRef.current, e.features);
      handleMapClick(
        [e.lngLat.lng, e.lngLat.lat],
        dataKeyBefore,
        beforeMapRef.current,
        beforeMapFeatures,
      );
    };

    const init = () => {
      beforeMapRef.current = new mapboxgl.Map({
        container: beforeContainer.current || "",
        style: mapStyleLink,
        center: [viewStateFromProps.longitude || 0, viewStateFromProps.latitude || 0],
        zoom: viewStateFromProps.zoom || INITIAL_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        projection: { name: "mercator" },
        scrollZoom: false,
      });

      afterMapRef.current = new mapboxgl.Map({
        container: afterContainer.current || "",
        style: mapStyleLink,
        center: [viewStateFromProps.longitude || 0, viewStateFromProps.latitude || 0],
        zoom: viewStateFromProps.zoom || INITIAL_ZOOM,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        projection: { name: "mercator" },
        scrollZoom: false,
      });

      beforeMapRef.current.on("style.load", handleStyleLoadBefore);

      beforeMapRef.current.on("idle", function () {
        setBeforeMapIsIdle(true);
      });

      afterMapRef.current.on("style.load", handleStyleLoadAfter);

      afterMapRef.current.on("idle", function () {
        setAfterMapIsIdle(true);
      });

      beforeMapRef.current.on("click", pfLayerIds, beforeMapClickHandler);

      afterMapRef.current.on("click", pfLayerIds, afterMapClickHandler);

      new Compare(beforeMapRef.current, afterMapRef.current, mapContainer.current);
    };

    if (!beforeMapRef.current || !afterMapRef.current) {
      init();
    }
    if (beforeMapRef.current) {
      beforeMapRef.current.on("style.load", handleStyleLoadBefore);
      beforeMapRef.current?.on("click", pfLayerIds, beforeMapClickHandler);
    }

    if (afterMapRef.current) {
      afterMapRef.current.on("style.load", handleStyleLoadAfter);
      afterMapRef.current?.on("click", pfLayerIds, afterMapClickHandler);
    }

    return () => {
      if (beforeMapRef.current) {
        beforeMapRef.current.off("style.load", handleStyleLoadBefore);
      }
      if (afterMapRef.current) {
        afterMapRef.current.off("style.load", handleStyleLoadAfter);
      }
    };
  }, [
    compare?.scenarioAfter,
    compare?.scenarioBefore,
    dataKeyAfter,
    dataKeyBefore,
    selectedDataset?.binHexColors,
    selectedDataset?.stops,
    handleMapClick,
    mapStyleLink,
    onStyleLoad,
    viewStateFromProps.latitude,
    viewStateFromProps.longitude,
    viewStateFromProps.zoom,
  ]);

  const handleResetMap = () => {
    const lat = viewStateFromProps.latitude || 0;
    const lng = viewStateFromProps.longitude || 0;

    beforeMapRef.current?.flyTo({
      center: [lng, lat],
      zoom: viewStateFromProps.zoom || 2.2,
      duration: 1500,
    });
    afterMapRef.current?.flyTo({
      center: [lng, lat],
      zoom: viewStateFromProps.zoom || 2.2,
      duration: 1500,
    });

    removeMapPopups(beforeMapRef.current);
    removeMapPopups(afterMapRef.current);
    setTimeout(() => {
      beforeMapRef.current?.fire("click", {
        lngLat: { lng, lat },
        point: beforeMapRef.current.project({ lng, lat }),
        originalEvent: {},
      });
    }, 1200);

    setTimeout(() => {
      afterMapRef.current?.fire("click", {
        lngLat: { lng, lat },
        point: afterMapRef.current?.project({ lng, lat }),
        originalEvent: {},
      });
    }, 1200);
  };

  const onZoom = (type: "in" | "out") => {
    if (viewState.longitude !== undefined && viewState.latitude !== undefined) {
      const zoom =
        type === "in"
          ? (beforeMapRef.current?.getZoom() || MIN_ZOOM) + 1
          : (beforeMapRef.current?.getZoom() || MIN_ZOOM) - 1;
      beforeMapRef.current?.flyTo({
        center: [viewState.longitude, viewState.latitude],
        zoom,
        duration: 300,
      });
      afterMapRef.current?.flyTo({
        center: [viewState.longitude, viewState.latitude],
        zoom,
        duration: 300,
      });
    }
  };

  return (
    <Container>
      {!hideTitle && <Header degrees={1} dataset={selectedDataset} showCompare={true} />}
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
          zoom={beforeMapRef.current?.getZoom() || MIN_ZOOM}
          maxZoom={MAX_ZOOM + 100}
          onZoomIn={() => onZoom("in")}
          onZoomOut={() => onZoom("out")}
        />
      )}

      <Content>
        <MapContainer
          ref={mapContainer}
          scenarioBefore={compare?.scenarioBefore || 1}
          scenarioAfter={compare?.scenarioAfter || 2}
        >
          <MapDiv ref={beforeContainer} id={`before_map_${Math.floor(Math.random() * 10000)}`} />
          <MapDiv ref={afterContainer} id={`after_map_${Math.floor(Math.random() * 10000)}`} />
        </MapContainer>
      </Content>
      <MapLink dataset={selectedDataset} />
    </Container>
  );
}
