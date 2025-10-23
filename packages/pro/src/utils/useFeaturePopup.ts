import { useState, useEffect, useCallback } from "react";
import { types, consts } from "@probable-futures/lib";

import { useMapData } from "../contexts/DataContext";
import { AppDispatch } from "../store/store";
import { UPDATE_CLICKED_MAP_INFO } from "../store/actions";
import { ClickedMapInfo } from "../utils/projectHelper";

export const getDataByKey = <T extends types.PopupFeature, U extends keyof T>(feature: T, key: U) =>
  feature ? feature[key] : undefined;

export const getFeature = (
  features: Array<any>,
  longitude: number,
  latitude: number,
  x: number,
  y: number,
  dataKey: consts.DegreeDataKeys,
) => {
  const dataFeature = features
    ? features.find((feature) => feature.layer.id.includes(consts.DATA_LAYER_ID_PREFIX))
    : undefined;

  return {
    latitude,
    longitude,
    x,
    y,
    selectedField: dataKey,
    selectedData: {
      mid: getDataByKey(dataFeature?.properties, `${dataKey}_mid`),
      low: getDataByKey(dataFeature?.properties, `${dataKey}_low`),
      high: getDataByKey(dataFeature?.properties, `${dataKey}_high`),
    },
    ...dataFeature?.properties,
  };
};

export default function useFeaturePopup({
  degrees,
  clickedMapInfo,
  dispatch,
}: {
  degrees: number;
  clickedMapInfo?: ClickedMapInfo;
  dispatch: AppDispatch;
}) {
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [{ dataKey }] = consts.degreesOptions.filter((d) => d.value === degrees);
  const [feature, setFeature] = useState<types.PopupFeature>({
    latitude: 0,
    longitude: 0,
    selectedField: dataKey,
    selectedData: {},
  });
  const { mapRef } = useMapData();

  useEffect(() => {
    if (popupVisible && feature.selectedField !== dataKey) {
      setFeature({
        ...feature,
        selectedField: dataKey,
        selectedData: {
          mid: getDataByKey(feature, `${dataKey}_mid`),
          low: getDataByKey(feature, `${dataKey}_low`),
          high: getDataByKey(feature, `${dataKey}_high`),
        },
      });
    }
  }, [dataKey, feature, popupVisible]);

  useEffect(() => {
    if (mapRef.current && clickedMapInfo?.x && clickedMapInfo?.y && clickedMapInfo?.coordinate) {
      const mapBoxMap = mapRef.current.getMap() as mapboxgl.Map;
      const [longitude, latitude] = clickedMapInfo.coordinate;
      const { x, y } = clickedMapInfo;
      const features = mapBoxMap.queryRenderedFeatures([x, y]);
      const dataFeature = getFeature(features, longitude, latitude, x, y, dataKey);

      setFeature(dataFeature);
      if (!popupVisible) {
        setPopupVisible(true);
      }
    }
  }, [clickedMapInfo, dataKey, mapRef, popupVisible]);

  const onClose = useCallback(() => {
    setPopupVisible(false);
    dispatch({ type: UPDATE_CLICKED_MAP_INFO, payload: { clickedMapInfo: undefined } });
  }, [dispatch]);

  return { popupVisible, onClose, feature, setPopupVisible };
}
