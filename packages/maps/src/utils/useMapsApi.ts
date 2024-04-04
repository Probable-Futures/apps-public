import { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { types } from "@probable-futures/lib";
import { Projection } from "mapbox-gl";

import {
  defaultDegreesForChangeMaps,
  defaultDegreesForNonChangeMaps,
  supportedProjections,
} from "../contexts/DataContext";
import { PUBLISHED_MAPS_QUERY } from "../graphql/queries/maps";
import mapsQuery from "../graphql/queries/maps";
import { setQueryParam, getQueryParam, deleteQueryParam } from "./index";
import {
  MAP_PROJECTION_QUERY_PARAM,
  MAP_QUERY_PARAM,
  MAP_VERSION_QUERY_PARAM,
  OLD_MAP_PROJECTION_QUERY_PARAM,
  OLD_MAP_VERSION_QUERY_PARAM,
  OLD_WARMING_SCENARIO_QUERY_PARAM,
  VOLUME_QUERY_PARAM,
  WARMING_SCENARIO_QUERY_PARAM,
} from "../consts/mapConsts";

type Props = {
  datasets: types.Map[];
  fetchAllMaps?: boolean;
  setDatasets: (arg: any) => void;
  setSelectedDataset: (arg: any) => void;
  setDegrees: (arg: any) => void;
  setMapProjection?: (arg: Projection) => void;
  setBins?: (bins: any) => void;
  setColorScheme?: (binHexColors: any) => void;
  setMidValueShown?: (arg: any) => void;
};

const supportedValues = ["0.5", "1", "1.5", "2", "2.5", "3"];

const isValidWarmingScenario = (value: string | null) => {
  if (!value) {
    return false;
  }
  return supportedValues.includes(value);
};

export default function useMapsApi({
  datasets,
  fetchAllMaps,
  setDatasets,
  setSelectedDataset,
  setDegrees,
  setMapProjection,
  setBins,
  setColorScheme,
  setMidValueShown,
}: Props) {
  const { data } = useQuery(fetchAllMaps ? mapsQuery : PUBLISHED_MAPS_QUERY);

  useEffect(() => {
    if (datasets.length === 0 && data) {
      const maps: types.Map[] = data.pfMaps.nodes;
      if (maps.length > 0) {
        const volume = getQueryParam(VOLUME_QUERY_PARAM);
        deleteQueryParam(VOLUME_QUERY_PARAM);

        const mapQueryParam = getQueryParam(MAP_QUERY_PARAM);
        const version = getQueryParam(MAP_VERSION_QUERY_PARAM, OLD_MAP_VERSION_QUERY_PARAM);
        const warmingScenario = getQueryParam(
          WARMING_SCENARIO_QUERY_PARAM,
          OLD_WARMING_SCENARIO_QUERY_PARAM,
        );
        let mapProjection = getQueryParam(
          MAP_PROJECTION_QUERY_PARAM,
          OLD_MAP_PROJECTION_QUERY_PARAM,
        );

        let warmingScenarioValue = isValidWarmingScenario(warmingScenario)
          ? parseFloat(warmingScenario!)
          : undefined;

        let selectedMap: types.Map | undefined;

        if (mapQueryParam) {
          /** 
            MAP_QUERY_PARAM used to point to map_style_id,
            so check if users are still assiging map_style_id
            instead of the map slug
          */
          selectedMap = maps.find(({ mapStyleId }) => mapQueryParam === mapStyleId);
          if (!selectedMap) {
            // if the version param is provided find the map with the specified version
            if (version) {
              selectedMap = maps.find(
                ({ slug, mapVersion }) =>
                  slug === mapQueryParam && mapVersion.toString() === version,
              );
            }
            // fallback to the latest version of the selected map
            if (!selectedMap) {
              selectedMap = maps.find(({ slug, isLatest }) => slug === mapQueryParam && isLatest);
            }
          }
        }
        if (!selectedMap) {
          selectedMap = maps.find(({ dataset, isLatest }) => {
            if (volume) {
              return dataset.pfDatasetParentCategoryByParentCategory.name === volume && isLatest;
            } else {
              return isLatest;
            }
          });
        }
        if (
          !mapProjection ||
          !supportedProjections.find((projection) => mapProjection === projection)
        ) {
          mapProjection = "mercator";
        }
        setMapProjection?.({ name: mapProjection } as Projection);
        const selectedDataset = selectedMap || maps[0];
        if (
          !warmingScenarioValue ||
          (warmingScenarioValue === 0.5 &&
            (selectedDataset.isDiff || selectedDataset?.name.toLowerCase().startsWith("change")))
        ) {
          warmingScenarioValue =
            selectedDataset.isDiff || selectedDataset?.name.toLowerCase().startsWith("change")
              ? defaultDegreesForChangeMaps
              : defaultDegreesForNonChangeMaps;
        }

        setDatasets(maps);
        setSelectedDataset(selectedDataset);
        setColorScheme?.(selectedDataset.binHexColors);
        setBins?.(selectedDataset.stops);
        setQueryParam({
          mapSlug: selectedDataset.slug,
          warmingScenario: warmingScenarioValue,
          version: selectedDataset.isLatest ? "latest" : selectedDataset.mapVersion.toString(),
          mapProjection,
        });
        setDegrees(warmingScenarioValue);
        setMidValueShown?.(selectedDataset.methodUsedForMid);
      }
    }
  }, [
    data,
    datasets.length,
    setDatasets,
    setSelectedDataset,
    setDegrees,
    setMapProjection,
    setBins,
    setColorScheme,
    setMidValueShown,
  ]);
}
