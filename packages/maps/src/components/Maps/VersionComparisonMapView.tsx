import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import mapboxgl, { Map as MapBoxMap, Projection } from "mapbox-gl";
import { MapRef } from "react-map-gl";
import ReactDOM from "react-dom/client";
// @ts-ignore
import Compare from "mapbox-gl-compare";
import styled, { createGlobalStyle } from "styled-components";

import { consts, types, utils } from "@probable-futures/lib";
import { BinningType } from "@probable-futures/lib/src/utils/colors";
import { components, contexts } from "@probable-futures/components-lib";
import { ReactComponent as CloseIcon } from "@probable-futures/components-lib/src/assets/icons/cancel-circle.svg";
import { purpleFilter } from "@probable-futures/components-lib/src/styles/commonStyles";

import { colors } from "../../consts";
import { getMapBuilderMinZoom, MAP_BUILDER_MAX_ZOOM } from "../../consts/mapConsts";
import { isEra5Map } from "../../consts/era5Maps";
import { getDataByKey } from "../../utils";
import { getComparisonSideShortLabel } from "../../utils/mapVersions";
import useGlobeLines, { LINE_LAYER_LABEL_PREFIX } from "../../utils/useGlobeLines";

const COMPARE_POPUP_CLASS = "pf-version-compare-popup";

type Side = "before" | "after";

type Props = {
  datasetBefore: types.Map;
  datasetAfter: types.Map;
  /** What each side is called on the divider. Not a version number — a side may be ERA5. */
  labelBefore: string;
  labelAfter: string;
  mapStyleUrlBefore: string;
  mapStyleUrlAfter: string;
  mapboxAccessToken: string;
  degrees: number;
  /** Shared by both sides, so a colour difference is a data difference. */
  bins?: number[];
  binHexColors?: string[];
  percentileValue: BinningType;
  landColor: string;
  oceanColor: string;
  showInspector: boolean;
  mapProjection: Projection;
  height: number | string;
  viewState: Partial<{ longitude: number; latitude: number; zoom: number }>;
  tempUnit: types.TempUnit;
  precipitationUnit: types.PrecipitationUnit;
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  onMove?: (viewState: { longitude: number; latitude: number; zoom: number }) => void;
};

export type VersionComparisonMapHandle = {
  flyTo: (options: mapboxgl.CameraOptions & mapboxgl.AnimationOptions) => void;
  fitBounds: (bounds: mapboxgl.LngLatBoundsLike) => void;
  zoomTo: (zoom: number) => void;
};

const ComparisonContainer = styled.div<{
  height: number | string;
  labelBefore: string;
  labelAfter: string;
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
      content: ${({ labelBefore }) => `"${labelBefore}"`};
      left: -91px;
    }

    ::after {
      content: ${({ labelAfter }) => `"${labelAfter}"`};
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

const VersionLabel = styled.div`
  font-family: "RelativeMono";
  font-size: 12px;
  color: ${colors.lightGrey2};
  letter-spacing: 0;
  margin-bottom: 8px;
`;

/** Mirrors the builder's single-map `updateMapStyles`, so each side matches it. */
const applyBuilderStyles = (
  map: MapBoxMap,
  {
    dataLayerPaintProperties,
    landColor,
    oceanColor,
  }: {
    dataLayerPaintProperties: any;
    landColor: string;
    oceanColor: string;
  },
) => {
  const { layers } = map.getStyle();

  layers?.forEach(({ id, type }) => {
    if (id === "land") {
      map.setPaintProperty("land", "background-color", landColor);
    } else if (id === "water") {
      map.setPaintProperty("water", "fill-color", oceanColor);
    } else if (id.includes(consts.DATA_LAYER_ID_PREFIX)) {
      map.setPaintProperty(id, "fill-color", dataLayerPaintProperties);
      map.setPaintProperty(id, "fill-antialias", ["step", ["zoom"], false, 6, true]);
      map.setPaintProperty(id, "fill-outline-color", "#ffffff");
    } else if (
      id.includes("boundary") ||
      ((type === "symbol" || id.includes("road")) && !id.includes(LINE_LAYER_LABEL_PREFIX))
    ) {
      map.setLayoutProperty(id, "visibility", "visible");
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

const VersionComparisonMapView = forwardRef<VersionComparisonMapHandle, Props>(
  (
    {
      datasetBefore,
      datasetAfter,
      labelBefore,
      labelAfter,
      mapStyleUrlBefore,
      mapStyleUrlAfter,
      mapboxAccessToken,
      degrees,
      bins,
      binHexColors,
      percentileValue,
      landColor,
      oceanColor,
      showInspector,
      mapProjection,
      height,
      viewState,
      tempUnit,
      precipitationUnit,
      datasetDescriptionResponse,
      onMove,
    },
    ref,
  ) => {
    const compareContainerRef = useRef<HTMLDivElement>(null);
    const beforeContainerRef = useRef<HTMLDivElement>(null);
    const afterContainerRef = useRef<HTMLDivElement>(null);
    const compareInstanceRef = useRef<any>(null);
    const onMoveRef = useRef(onMove);
    onMoveRef.current = onMove;

    const beforePopupRef = useRef<mapboxgl.Popup | null>(null);
    const afterPopupRef = useRef<mapboxgl.Popup | null>(null);
    const beforePopupRootRef = useRef<ReactDOM.Root | null>(null);
    const afterPopupRootRef = useRef<ReactDOM.Root | null>(null);
    const lastClickedLngLatRef = useRef<[number, number] | null>(null);

    // In state, not a ref: switching versions recreates both maps and every effect
    // below has to re-bind. Shared legend bins mean the paint props can be
    // identical across that swap, so the instances have to be the dependency.
    const [maps, setMaps] = useState<{ before: MapBoxMap; after: MapBoxMap } | null>(null);

    // `useGlobeLines` only calls `.getMap()`, so a thin wrapper reuses it per side.
    // Must stay null until the maps exist — the hook guards the ref, not the map.
    const beforePseudoRef = useMemo(
      () => (maps ? ({ getMap: () => maps.before } as unknown as MapRef) : null),
      [maps],
    );
    const afterPseudoRef = useMemo(
      () => (maps ? ({ getMap: () => maps.after } as unknown as MapRef) : null),
      [maps],
    );
    const { drawGlobeLines: drawBeforeGlobeLines, removeGlobeLayers: removeBeforeGlobeLayers } =
      useGlobeLines(mapProjection, beforePseudoRef);
    const { drawGlobeLines: drawAfterGlobeLines, removeGlobeLayers: removeAfterGlobeLayers } =
      useGlobeLines(mapProjection, afterPseudoRef);

    const [{ dataKey }] = consts.degreesOptions.filter((d) => d.value === degrees);

    const paint = useMemo(
      () =>
        binHexColors && bins
          ? utils.getMapLayerColors(binHexColors, bins, degrees, percentileValue)
          : null,
      [binHexColors, bins, degrees, percentileValue],
    );

    const styleOptions = useMemo(
      () => ({
        dataLayerPaintProperties: paint,
        landColor,
        oceanColor,
      }),
      [paint, landColor, oceanColor],
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
        side: Side,
      ) => {
        if (!map) {
          return;
        }
        const dataset = side === "before" ? datasetBefore : datasetAfter;
        // ERA5 is not a database row, so it has no status to name beside its label.
        const versionLabel = isEra5Map(dataset)
          ? getComparisonSideShortLabel(dataset)
          : `${getComparisonSideShortLabel(dataset)} · ${dataset.status ?? ""}`;
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
              <VersionLabel>{versionLabel}</VersionLabel>
              <components.PopupContent
                feature={popupFeature}
                dataset={dataset}
                degreesOfWarming={degrees}
                tempUnit={tempUnit}
                showInspector={showInspector}
                datasetDescriptionResponse={datasetDescriptionResponse}
                precipitationUnit={precipitationUnit}
                isExperiment
              />
            </PopupBody>
          </contexts.ThemeProvider>,
        );
      },
      [
        datasetBefore,
        datasetAfter,
        dataKey,
        degrees,
        tempUnit,
        showInspector,
        precipitationUnit,
        datasetDescriptionResponse,
        closePopups,
      ],
    );

    useEffect(() => {
      if (
        !beforeContainerRef.current ||
        !afterContainerRef.current ||
        !compareContainerRef.current ||
        !mapStyleUrlBefore ||
        !mapStyleUrlAfter
      ) {
        return;
      }
      mapboxgl.accessToken = mapboxAccessToken;

      const center: [number, number] = [viewState.longitude ?? 0, viewState.latitude ?? 0];
      let zoom = viewState.zoom ?? consts.INITIAL_ZOOM;
      zoom = zoom === consts.INITIAL_ZOOM ? consts.INITIAL_ZOOM + 0.01 : zoom; // Hack to force mapbox-gl-compare to render both maps on initial load
      const minZoom = getMapBuilderMinZoom(mapProjection.name);

      const sharedOptions = {
        center,
        zoom,
        minZoom,
        maxZoom: MAP_BUILDER_MAX_ZOOM,
        preserveDrawingBuffer: true,
        projection: mapProjection,
      };

      const beforeMap = new mapboxgl.Map({
        container: beforeContainerRef.current,
        style: mapStyleUrlBefore,
        ...sharedOptions,
      });
      const afterMap = new mapboxgl.Map({
        container: afterContainerRef.current,
        style: mapStyleUrlAfter,
        ...sharedOptions,
      });
      compareInstanceRef.current = new Compare(beforeMap, afterMap, compareContainerRef.current);
      setMaps({ before: beforeMap, after: afterMap });

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
        setMaps(null);
        beforeMap.off("moveend", handleMoveEnd);
        afterMap.off("moveend", handleMoveEnd);
        compareInstanceRef.current?.remove?.();
        compareInstanceRef.current = null;
        beforeMap.remove();
        afterMap.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapStyleUrlBefore, mapStyleUrlAfter, mapboxAccessToken]);

    // Only the `before` map is driven: mapbox-gl-compare keeps the other in sync.
    useImperativeHandle(
      ref,
      () => ({
        flyTo: (options) => maps?.before.flyTo(options),
        fitBounds: (bounds) => maps?.before.fitBounds(bounds, {}),
        zoomTo: (zoom) => maps?.before.zoomTo(zoom, { duration: 300 }),
      }),
      [maps],
    );

    useEffect(() => {
      if (!maps) {
        return;
      }
      const { before: beforeMap, after: afterMap } = maps;
      const minZoom = getMapBuilderMinZoom(mapProjection.name);
      [beforeMap, afterMap].forEach((map) => {
        map.setProjection(mapProjection);
        map.setMinZoom(minZoom);
      });
      if (mapProjection.name !== "mercator" && mapProjection.name !== "globe") {
        if (beforeMap.getZoom() < consts.MIN_ZOOM_3) {
          beforeMap.setZoom(consts.MIN_ZOOM_3);
        }
      }
    }, [maps, mapProjection]);

    // Re-applied on every style load, which drops the paint properties.
    useEffect(() => {
      if (!maps || !styleOptions.dataLayerPaintProperties) {
        return;
      }
      const cleanups = (
        [
          [maps.before, drawBeforeGlobeLines],
          [maps.after, drawAfterGlobeLines],
        ] as const
      ).map(([map, drawGlobeLines]) => {
        const onStyleLoad = () => {
          applyBuilderStyles(map, styleOptions);
          if (mapProjection.name === "globe") {
            drawGlobeLines();
          }
        };
        if (map.isStyleLoaded()) {
          onStyleLoad();
        }
        map.on("style.load", onStyleLoad);
        return () => map.off("style.load", onStyleLoad);
      });
      return () => cleanups.forEach((cleanup) => cleanup());
    }, [maps, styleOptions, mapProjection, drawBeforeGlobeLines, drawAfterGlobeLines]);

    useEffect(() => {
      if (mapProjection.name === "globe") {
        drawBeforeGlobeLines();
        drawAfterGlobeLines();
      } else {
        removeBeforeGlobeLayers();
        removeAfterGlobeLayers();
      }
    }, [
      mapProjection,
      drawBeforeGlobeLines,
      drawAfterGlobeLines,
      removeBeforeGlobeLayers,
      removeAfterGlobeLayers,
    ]);

    // A click on either side popups BOTH, each reading its own version's tiles.
    useEffect(() => {
      if (!maps) {
        return;
      }
      const { before: beforeMap, after: afterMap } = maps;

      const onClick = (e: mapboxgl.MapMouseEvent) => {
        const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        const { point } = e;
        const beforeFeatures = beforeMap.queryRenderedFeatures([point.x, point.y]);
        const afterFeatures = afterMap.queryRenderedFeatures([point.x, point.y]);
        lastClickedLngLatRef.current = lngLat;
        renderPopupAt(beforeMap, lngLat, beforeFeatures, "before");
        renderPopupAt(afterMap, lngLat, afterFeatures, "after");
      };

      beforeMap.on("click", onClick);
      afterMap.on("click", onClick);
      return () => {
        beforeMap.off("click", onClick);
        afterMap.off("click", onClick);
      };
    }, [maps, renderPopupAt]);

    // Keeps open popups current when the scenario or unit changes, without a re-click.
    useEffect(() => {
      const lngLat = lastClickedLngLatRef.current;
      if (!lngLat || !maps) {
        return;
      }
      const { before: beforeMap, after: afterMap } = maps;
      const point = beforeMap.project(lngLat);
      if (beforePopupRef.current) {
        renderPopupAt(
          beforeMap,
          lngLat,
          beforeMap.queryRenderedFeatures([point.x, point.y]),
          "before",
        );
      }
      if (afterPopupRef.current) {
        renderPopupAt(
          afterMap,
          lngLat,
          afterMap.queryRenderedFeatures([point.x, point.y]),
          "after",
        );
      }
    }, [maps, renderPopupAt]);

    return (
      <>
        <ComparePopupGlobalStyles />
        <ComparisonContainer
          ref={compareContainerRef}
          height={height}
          labelBefore={labelBefore}
          labelAfter={labelAfter}
        >
          <MapDiv ref={beforeContainerRef} />
          <MapDiv ref={afterContainerRef} />
        </ComparisonContainer>
      </>
    );
  },
);

export default VersionComparisonMapView;
