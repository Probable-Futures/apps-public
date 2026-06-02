import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import mapboxgl, { Map as MapBoxMap, Projection } from "mapbox-gl";
import ReactDOM from "react-dom/client";
// @ts-ignore
import Compare from "mapbox-gl-compare";
import styled, { createGlobalStyle } from "styled-components";

import { consts, types, utils } from "@probable-futures/lib";
import { BinningType } from "@probable-futures/lib/src/utils/colors";
import { components, contexts } from "@probable-futures/components-lib";
import { ReactComponent as CloseIcon } from "@probable-futures/components-lib/src/assets/icons/cancel-circle.svg";
import { purpleFilter } from "@probable-futures/components-lib/src/styles/commonStyles";

import { useTranslation } from "../../contexts/TranslationContext";
import { colors } from "../../consts";
import { getDataByKey } from "../../utils/";

const COMPARE_POPUP_CLASS = "pf-compare-popup";

type Props = {
  selectedDataset: types.Map;
  scenarioBefore: number;
  scenarioAfter: number;
  mapboxAccessToken: string;
  mapStyleUrl: string;
  showCountryBorders: boolean;
  locale: string;
  height: number | string;
  viewState: Partial<{ longitude: number; latitude: number; zoom: number }>;
  tempUnit: types.TempUnit;
  precipitationUnit: types.PrecipitationUnit;
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  mapProjection: Projection;
  percentileValue: BinningType;
  activeClimateZoneLayers?: string[];
  climateZoneBinHexColors?: string[];
  onReadMoreClick?: () => void;
  onMove?: (viewState: { longitude: number; latitude: number; zoom: number }) => void;
};

export type ComparisonMapHandle = {
  flyTo: (options: mapboxgl.CameraOptions & mapboxgl.AnimationOptions) => void;
};

const ComparisonContainer = styled.div<{
  height: number | string;
  scenarioBefore: number;
  scenarioAfter: number;
}>`
  position: relative;
  width: 100vw;
  height: ${({ height }) => (typeof height === "number" ? `${height}px` : height)};
  user-select: none;

  .mapboxgl-compare {
    background-color: ${colors.darkPurple};
    position: absolute;
    width: 2px;
    height: 100%;
    z-index: 1;

    ::before,
    ::after {
      font-family: "RelativeMono";
      background-color: ${colors.darkPurple};
      border: 1px solid ${colors.white};
      display: block;
      position: absolute;
      top: calc(50% - 10px);
      padding: 2px 0;
      width: 62px;
      text-align: center;
      color: ${colors.lightCream};
      font-size: 15px;
      letter-spacing: 0;
    }

    ::before {
      content: ${({ scenarioBefore }) => `"${scenarioBefore}°C"`};
      left: -91px;
    }

    ::after {
      content: ${({ scenarioAfter }) => `"${scenarioAfter}°C"`};
      right: -89px;
    }
  }

  .mapboxgl-compare .compare-swiper-vertical {
    background-color: ${colors.darkPurple};
    box-shadow: inset 0 0 0 2px ${colors.white};
    display: inline-block;
    border-radius: 50%;
    position: absolute;
    width: 40px;
    height: 40px;
    top: 50%;
    left: -20px;
    margin: -20px 1px 0;
    color: ${colors.white};
    cursor: ew-resize;

    ::before,
    ::after {
      content: "";
      position: absolute;
      top: 50%;
      width: 0;
      height: 0;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      transform: translateY(-50%);
    }

    ::before {
      left: 10px;
      border-right: 6px solid ${colors.lightCream};
    }

    ::after {
      right: 10px;
      border-left: 6px solid ${colors.lightCream};
    }
  }
`;

const MapDiv = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
`;

const ComparePopupGlobalStyles = createGlobalStyle`
  .${COMPARE_POPUP_CLASS} {
    z-index: 1;

    .mapboxgl-popup-tip {
      width: 12px;
      height: 12px;
      transform: rotate(45deg);
      background-color: ${colors.white};
      border-width: 1px !important;
      margin-bottom: -8px;
      border-left: 1px solid ${colors.grey};
      border-top: 1px solid ${colors.grey};
      box-sizing: content-box;
    }

    .mapboxgl-popup-content {
      background-color: ${colors.white};
      border-radius: 6px;
      border: 1px solid ${colors.grey};
      padding: 16px 16px 0;
      box-sizing: border-box;
      box-shadow: none;
    }

    .mapboxgl-popup-close-button {
      display: none;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 1;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    ${purpleFilter}
  }
`;

const PopupBody = styled.div``;

const applyDataLayerStyles = (
  map: MapBoxMap,
  paintProperties: any,
  showCountryBorders: boolean,
  locale: string,
) => {
  const lang = locale === "zh" ? "zh-Hans" : locale;
  const { layers } = map.getStyle();

  map.setPaintProperty("water", "fill-color", colors.whiteSmoke);
  map.setLayerZoomRange("country-label", 3, 10);
  [
    "country-label",
    "state-label",
    "settlement-subdivision-label",
    "settlement-minor-label",
    "settlement-major-label",
  ].forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "text-field", ["get", `name_${lang}`]);
      map.setLayoutProperty(layerId, "visibility", "visible");
    }
  });

  layers.forEach(({ id }: { id: string }) => {
    if (id.includes(consts.DATA_LAYER_ID_PREFIX)) {
      map.setPaintProperty(id, "fill-color", paintProperties);
      map.setPaintProperty(id, "fill-antialias", ["step", ["zoom"], false, 6, true]);
      map.setPaintProperty(id, "fill-outline-color", colors.whiteOriginal);
    } else if (id.includes("boundary")) {
      map.setLayoutProperty(id, "visibility", showCountryBorders ? "visible" : "none");
    }
  });
};

const buildPopupFeature = (
  features: mapboxgl.MapboxGeoJSONFeature[] | undefined,
  lngLat: [number, number],
  dataKey: consts.DegreeDataKeys,
): types.PopupFeature => {
  const [longitude, latitude] = lngLat;
  const dataFeature = features?.find((f) => f.layer.id.includes(consts.DATA_LAYER_ID_PREFIX));
  return {
    latitude,
    longitude,
    selectedField: dataKey,
    selectedData: {
      mid: getDataByKey(dataFeature?.properties as types.PopupFeature, `${dataKey}_mid`),
      low: getDataByKey(dataFeature?.properties as types.PopupFeature, `${dataKey}_low`),
      high: getDataByKey(dataFeature?.properties as types.PopupFeature, `${dataKey}_high`),
    },
    ...dataFeature?.properties,
  };
};

const ComparisonMapView = forwardRef<ComparisonMapHandle, Props>(
  (
    {
      selectedDataset,
      scenarioBefore,
      scenarioAfter,
      mapboxAccessToken,
      mapStyleUrl,
      showCountryBorders,
      locale,
      height,
      viewState,
      tempUnit,
      precipitationUnit,
      datasetDescriptionResponse,
      mapProjection,
      percentileValue,
      activeClimateZoneLayers,
      climateZoneBinHexColors,
      onReadMoreClick,
      onMove,
    },
    ref,
  ) => {
    const compareContainerRef = useRef<HTMLDivElement>(null);
    const beforeContainerRef = useRef<HTMLDivElement>(null);
    const afterContainerRef = useRef<HTMLDivElement>(null);
    const beforeMapRef = useRef<MapBoxMap | null>(null);
    const afterMapRef = useRef<MapBoxMap | null>(null);
    const compareInstanceRef = useRef<any>(null);
    const onMoveRef = useRef(onMove);
    onMoveRef.current = onMove;

    const beforePopupRef = useRef<mapboxgl.Popup | null>(null);
    const afterPopupRef = useRef<mapboxgl.Popup | null>(null);
    const beforePopupRootRef = useRef<ReactDOM.Root | null>(null);
    const afterPopupRootRef = useRef<ReactDOM.Root | null>(null);
    const lastClickedLngLatRef = useRef<[number, number] | null>(null);

    const { translate } = useTranslation();

    const [{ dataKey: dataKeyBefore }] = consts.degreesOptions.filter(
      (d) => d.value === scenarioBefore,
    );
    const [{ dataKey: dataKeyAfter }] = consts.degreesOptions.filter(
      (d) => d.value === scenarioAfter,
    );

    const effectiveBinHexColors = useMemo(() => {
      if (activeClimateZoneLayers?.length && climateZoneBinHexColors?.length) {
        return climateZoneBinHexColors;
      }
      return selectedDataset.binHexColors || [];
    }, [activeClimateZoneLayers, climateZoneBinHexColors, selectedDataset.binHexColors]);

    const paintBefore = useMemo(
      () =>
        utils.getMapLayerColors(
          effectiveBinHexColors,
          selectedDataset.stops || [],
          scenarioBefore,
          percentileValue,
        ),
      [effectiveBinHexColors, selectedDataset.stops, scenarioBefore, percentileValue],
    );

    const paintAfter = useMemo(
      () =>
        utils.getMapLayerColors(
          effectiveBinHexColors,
          selectedDataset.stops || [],
          scenarioAfter,
          percentileValue,
        ),
      [effectiveBinHexColors, selectedDataset.stops, scenarioAfter, percentileValue],
    );

    const closePopups = useCallback(() => {
      const before = beforePopupRef.current;
      const after = afterPopupRef.current;
      const beforeRoot = beforePopupRootRef.current;
      const afterRoot = afterPopupRootRef.current;
      beforePopupRef.current = null;
      afterPopupRef.current = null;
      beforePopupRootRef.current = null;
      afterPopupRootRef.current = null;
      lastClickedLngLatRef.current = null;
      before?.remove();
      after?.remove();
      // Defer root.unmount so it doesn't fire synchronously inside a parent
      // render commit (e.g. when toggling comparison mode off).
      setTimeout(() => {
        beforeRoot?.unmount();
        afterRoot?.unmount();
      }, 0);
    }, []);

    const renderPopupAt = useCallback(
      (
        map: MapBoxMap | null,
        lngLat: [number, number],
        features: mapboxgl.MapboxGeoJSONFeature[] | undefined,
        dataKey: consts.DegreeDataKeys,
        degrees: number,
        side: "before" | "after",
      ) => {
        if (!map || !datasetDescriptionResponse) {
          return;
        }
        const popupFeature = buildPopupFeature(features, lngLat, dataKey);

        let popup = side === "before" ? beforePopupRef.current : afterPopupRef.current;
        let root = side === "before" ? beforePopupRootRef.current : afterPopupRootRef.current;

        if (!popup) {
          const container = document.createElement("div");
          root = ReactDOM.createRoot(container);
          popup = new mapboxgl.Popup({
            anchor: "top",
            maxWidth: "none",
            focusAfterOpen: false,
            closeButton: false,
            closeOnClick: false,
            className: COMPARE_POPUP_CLASS,
          })
            .setLngLat(lngLat)
            .setDOMContent(container)
            .addTo(map);
          if (side === "before") {
            beforePopupRef.current = popup;
            beforePopupRootRef.current = root;
          } else {
            afterPopupRef.current = popup;
            afterPopupRootRef.current = root;
          }
        } else {
          popup.setLngLat(lngLat);
        }

        root!.render(
          <contexts.ThemeProvider theme="light">
            <PopupBody>
              <CloseButton onClick={closePopups} aria-label="Close">
                <CloseIcon />
              </CloseButton>
              <components.PopupContent
                feature={popupFeature}
                dataset={selectedDataset}
                degreesOfWarming={degrees}
                tempUnit={tempUnit}
                showInspector={false}
                datasetDescriptionResponse={datasetDescriptionResponse}
                precipitationUnit={precipitationUnit}
                mapPopoverText={translate("mapPopover")}
                keyText={translate("key")}
                onReadMoreClick={onReadMoreClick}
                onBaselineClick={onReadMoreClick}
              />
            </PopupBody>
          </contexts.ThemeProvider>,
        );
      },
      [
        selectedDataset,
        tempUnit,
        precipitationUnit,
        datasetDescriptionResponse,
        onReadMoreClick,
        translate,
        closePopups,
      ],
    );

    useEffect(() => {
      if (
        !beforeContainerRef.current ||
        !afterContainerRef.current ||
        !compareContainerRef.current
      ) {
        return;
      }
      mapboxgl.accessToken = mapboxAccessToken;

      const center: [number, number] = [viewState.longitude ?? 0, viewState.latitude ?? 0];
      let zoom = viewState.zoom ?? consts.INITIAL_ZOOM;
      zoom = zoom === consts.INITIAL_ZOOM ? consts.INITIAL_ZOOM + 0.01 : zoom; // Hack to force mapbox-gl-compare to render both maps on initial load

      const beforeMap = new mapboxgl.Map({
        container: beforeContainerRef.current,
        style: mapStyleUrl,
        center,
        zoom,
        minZoom: consts.MIN_ZOOM,
        maxZoom: consts.MAX_ZOOM,
        preserveDrawingBuffer: true,
        projection: mapProjection,
      });
      const afterMap = new mapboxgl.Map({
        container: afterContainerRef.current,
        style: mapStyleUrl,
        center,
        zoom,
        minZoom: consts.MIN_ZOOM,
        maxZoom: consts.MAX_ZOOM,
        preserveDrawingBuffer: true,
        projection: mapProjection,
      });
      beforeMapRef.current = beforeMap;
      afterMapRef.current = afterMap;
      compareInstanceRef.current = new Compare(beforeMap, afterMap, compareContainerRef.current);

      const handleMoveEnd = (ev: mapboxgl.MapboxEvent) => {
        const map = ev.target;
        const center = map.getCenter();
        onMoveRef.current?.({
          longitude: center.lng,
          latitude: center.lat,
          zoom: map.getZoom(),
        });
      };
      beforeMap.on("moveend", handleMoveEnd);
      afterMap.on("moveend", handleMoveEnd);

      return () => {
        closePopups();
        beforeMap.off("moveend", handleMoveEnd);
        afterMap.off("moveend", handleMoveEnd);
        compareInstanceRef.current?.remove?.();
        compareInstanceRef.current = null;
        beforeMap.remove();
        afterMap.remove();
        beforeMapRef.current = null;
        afterMapRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapStyleUrl, mapboxAccessToken, selectedDataset.mapStyleId]);

    useImperativeHandle(
      ref,
      () => ({
        flyTo: (options) => {
          beforeMapRef.current?.flyTo(options);
        },
      }),
      [],
    );

    useEffect(() => {
      const beforeMap = beforeMapRef.current;
      const afterMap = afterMapRef.current;
      if (!beforeMap || !afterMap) return;
      beforeMap.setProjection(mapProjection);
      afterMap.setProjection(mapProjection);
    }, [mapProjection]);

    useEffect(() => {
      const map = beforeMapRef.current;
      if (!map) return;
      const onStyleLoad = () => applyDataLayerStyles(map, paintBefore, showCountryBorders, locale);
      if (map.isStyleLoaded()) {
        onStyleLoad();
      }
      map.on("style.load", onStyleLoad);
      return () => {
        map.off("style.load", onStyleLoad);
      };
    }, [paintBefore, showCountryBorders, locale]);

    useEffect(() => {
      const map = afterMapRef.current;
      if (!map) return;
      const onStyleLoad = () => applyDataLayerStyles(map, paintAfter, showCountryBorders, locale);
      if (map.isStyleLoaded()) {
        onStyleLoad();
      }
      map.on("style.load", onStyleLoad);
      return () => {
        map.off("style.load", onStyleLoad);
      };
    }, [paintAfter, showCountryBorders, locale]);

    // Wire click handlers — click on either map shows a popup on BOTH maps at the
    // same coordinates, each showing its scenario's data.
    useEffect(() => {
      const beforeMap = beforeMapRef.current;
      const afterMap = afterMapRef.current;
      if (!beforeMap || !afterMap) return;

      const onClick = (e: mapboxgl.MapMouseEvent) => {
        const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        const point = e.point;
        const beforeFeatures = beforeMap.queryRenderedFeatures([point.x, point.y]);
        const afterFeatures = afterMap.queryRenderedFeatures([point.x, point.y]);
        lastClickedLngLatRef.current = lngLat;
        renderPopupAt(beforeMap, lngLat, beforeFeatures, dataKeyBefore, scenarioBefore, "before");
        renderPopupAt(afterMap, lngLat, afterFeatures, dataKeyAfter, scenarioAfter, "after");
      };

      beforeMap.on("click", onClick);
      afterMap.on("click", onClick);
      return () => {
        beforeMap.off("click", onClick);
        afterMap.off("click", onClick);
      };
    }, [renderPopupAt, dataKeyBefore, dataKeyAfter, scenarioBefore, scenarioAfter]);

    // When the scenario changes, re-render the open popups with new data for the
    // same point so users see the comparison update without re-clicking.
    useEffect(() => {
      const lngLat = lastClickedLngLatRef.current;
      if (!lngLat) return;
      const beforeMap = beforeMapRef.current;
      const afterMap = afterMapRef.current;
      if (!beforeMap || !afterMap) return;
      const point = beforeMap.project(lngLat);
      const beforeFeatures = beforeMap.queryRenderedFeatures([point.x, point.y]);
      const afterFeatures = afterMap.queryRenderedFeatures([point.x, point.y]);
      if (beforePopupRef.current) {
        renderPopupAt(beforeMap, lngLat, beforeFeatures, dataKeyBefore, scenarioBefore, "before");
      }
      if (afterPopupRef.current) {
        renderPopupAt(afterMap, lngLat, afterFeatures, dataKeyAfter, scenarioAfter, "after");
      }
    }, [renderPopupAt, dataKeyBefore, dataKeyAfter, scenarioBefore, scenarioAfter, tempUnit]);

    return (
      <>
        <ComparePopupGlobalStyles />
        <ComparisonContainer
          ref={compareContainerRef}
          height={height}
          scenarioBefore={scenarioBefore}
          scenarioAfter={scenarioAfter}
        >
          <MapDiv ref={beforeContainerRef} />
          <MapDiv ref={afterContainerRef} />
        </ComparisonContainer>
      </>
    );
  },
);

export default ComparisonMapView;
