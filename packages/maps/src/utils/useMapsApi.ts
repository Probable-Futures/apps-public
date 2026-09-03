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
import { findDefaultMap, findMapForParams, isLatestMapForSlug } from "./mapSelection";
import {
  DEFAULT_MAP_STATUS,
  LATEST_MAP_VERSION,
  MAP_PROJECTION_QUERY_PARAM,
  MAP_QUERY_PARAM,
  MAP_STATUS_QUERY_PARAM,
  MAP_VERSION_QUERY_PARAM,
  OLD_MAP_PROJECTION_QUERY_PARAM,
  OLD_MAP_VERSION_QUERY_PARAM,
  OLD_WARMING_SCENARIO_QUERY_PARAM,
  parseMapStatus,
  SCENARIO_AFTER_QUERY_PARAM,
  SCENARIO_BEFORE_QUERY_PARAM,
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
  setFilterByStatus?: (arg: string) => void;
  allowedProjections?: string[];
  setIsComparisonMapActive?: (arg: boolean) => void;
  setComparisonScenarioBefore?: (arg: number) => void;
  setComparisonScenarioAfter?: (arg: number) => void;
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
  setFilterByStatus,
  allowedProjections = supportedProjections,
  setIsComparisonMapActive,
  setComparisonScenarioBefore,
  setComparisonScenarioAfter,
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
        const mapStatus =
          parseMapStatus(getQueryParam(MAP_STATUS_QUERY_PARAM)) ?? DEFAULT_MAP_STATUS;
        const warmingScenario = getQueryParam(
          WARMING_SCENARIO_QUERY_PARAM,
          OLD_WARMING_SCENARIO_QUERY_PARAM,
        );
        const scenarioBefore = getQueryParam(SCENARIO_BEFORE_QUERY_PARAM);
        const scenarioAfter = getQueryParam(SCENARIO_AFTER_QUERY_PARAM);
        let mapProjection = getQueryParam(
          MAP_PROJECTION_QUERY_PARAM,
          OLD_MAP_PROJECTION_QUERY_PARAM,
        );

        let warmingScenarioValue = isValidWarmingScenario(warmingScenario)
          ? parseFloat(warmingScenario!)
          : undefined;
        let scenarioBeforeValue = isValidWarmingScenario(scenarioBefore)
          ? parseFloat(scenarioBefore!)
          : undefined;
        let scenarioAfterValue = isValidWarmingScenario(scenarioAfter)
          ? parseFloat(scenarioAfter!)
          : undefined;
        let comparisonActive =
          scenarioBeforeValue !== undefined &&
          scenarioAfterValue !== undefined &&
          scenarioBeforeValue < scenarioAfterValue;

        /**
          MAP_QUERY_PARAM used to point to map_style_id,
          so check if users are still assiging map_style_id
          instead of the map slug
        */
        let selectedMap = findMapForParams(maps, {
          slug: mapQueryParam,
          version,
          status: mapStatus,
        });
        if (!selectedMap) {
          const mapsInVolume = volume
            ? maps.filter(
                ({ dataset }) => dataset.pfDatasetParentCategoryByParentCategory.name === volume,
              )
            : maps;
          selectedMap = findDefaultMap(mapsInVolume, mapStatus);
        }
        if (
          !mapProjection ||
          !allowedProjections.find((projection) => mapProjection === projection)
        ) {
          mapProjection = "mercator";
        }
        setMapProjection?.({ name: mapProjection } as Projection);
        const selectedDataset = selectedMap || maps[0];
        const isChangeDataset =
          selectedDataset.isDiff || selectedDataset?.name.toLowerCase().startsWith("change");
        if (!warmingScenarioValue || (warmingScenarioValue === 0.5 && isChangeDataset)) {
          warmingScenarioValue = isChangeDataset
            ? defaultDegreesForChangeMaps
            : defaultDegreesForNonChangeMaps;
        }

        if (comparisonActive && isChangeDataset) {
          if (scenarioBeforeValue === 0.5) {
            scenarioBeforeValue = defaultDegreesForChangeMaps;
          }
          if (scenarioAfterValue! <= scenarioBeforeValue!) {
            scenarioAfterValue = scenarioBeforeValue! + 0.5;
          }
          if (scenarioAfterValue! > 3) {
            comparisonActive = false;
          }
        }

        const versionForUrl = isLatestMapForSlug(maps, selectedDataset, mapStatus)
          ? LATEST_MAP_VERSION
          : selectedDataset.mapVersion.toString();
        const statusForUrl = setFilterByStatus ? mapStatus : undefined;

        setDatasets(maps);
        setSelectedDataset(selectedDataset);
        setFilterByStatus?.(mapStatus);
        if (comparisonActive && setIsComparisonMapActive) {
          setIsComparisonMapActive(true);
          setComparisonScenarioBefore?.(scenarioBeforeValue!);
          setComparisonScenarioAfter?.(scenarioAfterValue!);
          setQueryParam({
            mapSlug: selectedDataset.slug,
            version: versionForUrl,
            status: statusForUrl,
            mapProjection,
            isComparisonMapActive: true,
            comparisonScenarioBefore: scenarioBeforeValue,
            comparisonScenarioAfter: scenarioAfterValue,
          });
          setDegrees(scenarioBeforeValue!);
        } else {
          setQueryParam({
            mapSlug: selectedDataset.slug,
            warmingScenario: warmingScenarioValue,
            version: versionForUrl,
            status: statusForUrl,
            mapProjection,
            isComparisonMapActive: false,
          });
          setDegrees(warmingScenarioValue);
        }
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
    setFilterByStatus,
    allowedProjections,
    setIsComparisonMapActive,
    setComparisonScenarioBefore,
    setComparisonScenarioAfter,
  ]);
}
