import { useCallback, useEffect, useMemo } from "react";
import { MapboxMap } from "react-map-gl";

import { consts, types, utils } from "@probable-futures/lib";
import { colors } from "@probable-futures/lib/src/consts";
import { hexToRGBA } from "@probable-futures/lib/src/utils";

const useClimateZoneHighlighter = ({
  degrees,
  map,
  activeClimateZoneLayers,
  datasetDescriptionResponse,
  binHexColors = [],
  bins = [],
  setActiveClimateZoneLayers,
}: {
  degrees: number;
  map?: MapboxMap;
  activeClimateZoneLayers?: string[];
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  binHexColors?: string[];
  bins?: number[];
  setActiveClimateZoneLayers: (activeClimateZoneLayer?: string[]) => void;
}) => {
  const deactivateClimateZoneLayer = useCallback(() => {
    if (binHexColors && bins && map) {
      const { layers } = map.getStyle();

      const dataLayerPaintProperties = utils.getMapLayerColors(binHexColors, bins, degrees);
      // Set paint properties for data layers
      layers.forEach(({ id }: { id: string }) => {
        if (id.includes(consts.DATA_LAYER_ID_PREFIX)) {
          map.setPaintProperty(id, "fill-color", dataLayerPaintProperties, { validate: false });
        }
      });
    }
    setActiveClimateZoneLayers(undefined);
  }, [binHexColors, bins, degrees, map, setActiveClimateZoneLayers]);

  const climateZoneBinHexColors = useMemo(() => {
    if (!activeClimateZoneLayers?.length) {
      return [];
    }
    let index = 0;
    let indexValueMap = new Map<number, string>();

    if (datasetDescriptionResponse?.climate_zones) {
      for (let i = 0; i < datasetDescriptionResponse?.climate_zones.length; i++) {
        const group = datasetDescriptionResponse.climate_zones[i];
        for (let j = 0; j < group.list.length; j++) {
          const climateZone = group.list[j];
          indexValueMap.set(index++, climateZone.value);
        }
      }
    }
    indexValueMap.forEach((value, key) => {
      const cz = activeClimateZoneLayers?.find(
        (activeClimateZoneLayer) => activeClimateZoneLayer === value,
      );
      if (!cz) {
        indexValueMap.delete(key);
      }
    });
    const updatedBinHexColors = [...binHexColors];
    for (let i = 0; i < updatedBinHexColors.length; i++) {
      if (!indexValueMap.has(i)) {
        const color = binHexColors[i];
        updatedBinHexColors[i] = hexToRGBA(color, 0.1);
      }
    }

    return updatedBinHexColors;
  }, [activeClimateZoneLayers, binHexColors, datasetDescriptionResponse?.climate_zones]);

  useEffect(() => {
    const updateColors = () => {
      if (activeClimateZoneLayers?.length === 0) {
        return deactivateClimateZoneLayer();
      }

      if (bins && map) {
        const { layers } = map.getStyle();
        const dataLayerPaintProperties = utils.getMapLayerColors(
          climateZoneBinHexColors,
          bins,
          degrees,
        );
        // Set paint properties for data layers
        layers.forEach(({ id }: { id: string }) => {
          if (id.includes(consts.DATA_LAYER_ID_PREFIX)) {
            map.setPaintProperty(id, "fill-color", dataLayerPaintProperties);
            map.setPaintProperty(id, "fill-antialias", ["step", ["zoom"], false, 6, true]);
            map.setPaintProperty(id, "fill-outline-color", colors.whiteOriginal);
          }
        });
      }
    };
    if (activeClimateZoneLayers && datasetDescriptionResponse?.climate_zones && binHexColors) {
      updateColors();
    }
  }, [
    activeClimateZoneLayers,
    binHexColors,
    bins,
    datasetDescriptionResponse,
    datasetDescriptionResponse?.climate_zones,
    deactivateClimateZoneLayer,
    degrees,
    map,
    climateZoneBinHexColors,
  ]);

  return {
    climateZoneBinHexColors,
  };
};

export default useClimateZoneHighlighter;
