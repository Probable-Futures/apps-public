import { useState, useEffect, useCallback } from "react";
import { consts, types } from "@probable-futures/lib";

export default function useFeaturePopup(selectedDegreesWarming: number) {
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const [{ dataKey }] = consts.degreesOptions.filter((d) => d.value === selectedDegreesWarming);
  const [feature, setFeature] = useState<types.PopupFeature>({
    latitude: 0,
    longitude: 0,
    selectedField: dataKey,
    selectedData: {},
  });

  useEffect(() => {
    if (
      popupVisible &&
      feature.selectedField !== dataKey &&
      Object.keys(feature.selectedData).length > 0
    ) {
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

  const setPopupFeature = useCallback(
    ({ features, lngLat }: types.MapEvent) => {
      const [longitude, latitude] = lngLat;
      const dataFeature = features
        ? features.find((feature) => feature.layer.id.includes(consts.DATA_LAYER_ID_PREFIX))
        : undefined;
      setFeature({
        latitude,
        longitude,
        selectedField: dataKey,
        selectedData: {
          mid: getDataByKey(dataFeature?.properties, `${dataKey}_mid`),
          low: getDataByKey(dataFeature?.properties, `${dataKey}_low`),
          high: getDataByKey(dataFeature?.properties, `${dataKey}_high`),
        },
        ...dataFeature?.properties,
      });

      if (!popupVisible) {
        setPopupVisible(true);
      }
    },
    [dataKey, popupVisible],
  );

  const getDataByKey = <T extends types.PopupFeature, U extends keyof T>(feature: T, key: U) =>
    feature ? feature[key] : undefined;

  return { popupVisible, setPopupVisible, feature, setPopupFeature };
}
