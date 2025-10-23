import { useCallback, useEffect, useRef } from "react";
import { addFilter, setFilter, removeFilter } from "@kepler.gl/actions";
import { types, utils } from "@probable-futures/lib";
import { KeplerTable, Datasets } from "@kepler.gl/table";
import { Filter } from "@kepler.gl/types";

import { AppDispatch } from "../store/store";
import { ProjectDatasetNode } from "../shared/types";
import { DATA_VALUES, DEGREES } from "../consts/MapConsts";

type Props = {
  degrees: number;
  filters?: Filter[];
  selectedClimateData?: types.Map;
  datasets?: Datasets;
  percentileValue: utils.BinningType;
  isDataAdded: boolean;
  initializingProject: boolean;
  projectDatasets: ProjectDatasetNode[];
  filteredProjectDatasets: ProjectDatasetNode[];
  dispatch: AppDispatch;
};

const getDegreePostfix = (degree: number) => {
  let result = "";
  switch (degree) {
    case 0.5:
    case 0:
      result = "_baseline";
      break;
    case 1:
      result = "_1c";
      break;
    case 1.5:
      result = "_1_5c";
      break;
    case 2:
      result = "_2c";
      break;
    case 2.5:
      result = "_2_5c";
      break;
    case 3:
      result = "_3c";
      break;
    default:
      break;
  }
  return result;
};

export const getFilterName = (
  degrees: number | undefined,
  dataset: KeplerTable,
  percentileValue: utils.BinningType,
) => {
  if (!dataset || degrees === undefined) {
    return undefined;
  }
  return dataset.fields.find((field: any) =>
    field.name.endsWith(`${getDegreePostfix(degrees)}_${percentileValue}`),
  )?.name;
};

const useDatasetFilter = ({
  degrees: degree,
  filters = [],
  selectedClimateData,
  datasets = {},
  percentileValue,
  isDataAdded,
  projectDatasets,
  filteredProjectDatasets,
  initializingProject,
  dispatch,
}: Props) => {
  const datasetIdsWithNewThresholdFilter = useRef<string[]>([]);

  const updateFilter = useCallback(
    (index: number, name: string, value: number[]) => {
      dispatch(setFilter(index, "name", name));
      dispatch(setFilter(index, "value", value));
    },
    [dispatch],
  );

  /**
   * checks if a threshold filter is added for each dataset
   */
  const checkIfDatasetsHaveFilter = useCallback(() => {
    const datasetThreshold: {
      [datasetId: string]: {
        hasThresholdFilter: boolean;
        outdatedFilterIdx: number;
        originalFilterIdx: number;
        filter?: Filter;
      };
    } = {};
    Object.keys(datasets).forEach((datasetId) => {
      const currentFilterName = getFilterName(degree, datasets[datasetId], percentileValue);
      const datasetFilters = filters.filter((filter) => filter.dataId?.includes(datasetId));
      datasetThreshold[datasetId] = {
        hasThresholdFilter: false,
        outdatedFilterIdx: -1,
        originalFilterIdx: -1,
        filter: undefined,
      };

      /**
       * a dataset has a threshold filter if we can find a filter with a name that corresponds to
       * the current binning/degree.
       */
      const filterIndex = currentFilterName
        ? datasetFilters.findIndex((filter) => filter.name.includes(currentFilterName))
        : -1;
      datasetThreshold[datasetId].hasThresholdFilter = filterIndex !== -1;
      datasetThreshold[datasetId].originalFilterIdx = filterIndex;
      /**
       * if the filter exists but with binning/degree different than the current ones
       * mark it is as outdated.
       */
      if (
        !datasetThreshold[datasetId].hasThresholdFilter &&
        datasetFilters.length > 0 &&
        currentFilterName
      ) {
        let index = -1;
        DEGREES.forEach((degree) => {
          DATA_VALUES.forEach((bin) => {
            const filterName = getFilterName(degree, datasets[datasetId], bin as utils.BinningType);
            if (filterName && filterName !== currentFilterName) {
              if (index === -1) {
                index = filters.findIndex(
                  (filter) => filter.dataId.includes(datasetId) && filter.name.includes(filterName),
                );
                datasetThreshold[datasetId].filter = datasetFilters[index];
              }
            }
          });
        });
        datasetThreshold[datasetId].outdatedFilterIdx = index;
      }
    });

    return datasetThreshold;
  }, [percentileValue, datasets, degree, filters]);

  useEffect(() => {
    if (
      isDataAdded &&
      selectedClimateData &&
      datasetIdsWithNewThresholdFilter.current.length === 0 &&
      projectDatasets.length > 0 &&
      filteredProjectDatasets.length > 0
    ) {
      const datasetsWithThreshold = checkIfDatasetsHaveFilter();
      const dataIds: string[] = [];
      Object.keys(datasets).forEach((datasetId, index) => {
        // update thresholdFilter if already exists
        const { outdatedFilterIdx, filter } = datasetsWithThreshold[datasetId];
        if (outdatedFilterIdx !== -1) {
          let startValue = selectedClimateData.dataset.minValue;
          let endValue = selectedClimateData.dataset.maxValue;
          if (filter?.value[0] !== undefined && filter.value[0] !== null) {
            startValue = filter.value[0];
          }
          if (filter?.value[1] !== undefined && filter.value[1] !== null) {
            endValue = filter.value[1];
          }
          updateFilter(
            outdatedFilterIdx,
            getFilterName(degree, datasets[datasetId], percentileValue) as string,
            [startValue, endValue],
          );
        }
        // add threshold filter if it does not exist
        else if (
          !datasetsWithThreshold[datasetId].hasThresholdFilter &&
          filteredProjectDatasets[index].pfDatasetId === selectedClimateData.dataset.id &&
          filteredProjectDatasets[index].enrichedDatasetFile &&
          !initializingProject
        ) {
          dataIds.push(datasetId);
        }
      });
      if (dataIds.length) {
        datasetIdsWithNewThresholdFilter.current = dataIds;
        setTimeout(() => {
          dataIds.forEach((dataId) => {
            dispatch(addFilter(dataId));
          });
        });
      }
    }
  }, [
    filteredProjectDatasets,
    projectDatasets.length,
    selectedClimateData,
    percentileValue,
    isDataAdded,
    datasets,
    degree,
    initializingProject,
    updateFilter,
    checkIfDatasetsHaveFilter,
    dispatch,
  ]);

  useEffect(() => {
    if (
      datasetIdsWithNewThresholdFilter.current.length > 0 &&
      filters.length > 0 &&
      selectedClimateData
    ) {
      const dataId = datasetIdsWithNewThresholdFilter.current[0];
      const filterName = getFilterName(degree, datasets[dataId], percentileValue);

      if (filterName) {
        updateFilter(filters.length - 1, filterName, [
          selectedClimateData.dataset.minValue,
          selectedClimateData.dataset.maxValue,
        ]);
        datasetIdsWithNewThresholdFilter.current =
          datasetIdsWithNewThresholdFilter.current.slice(1);
      }
    }
  }, [filters.length, datasets, degree, selectedClimateData, percentileValue, updateFilter]);

  /**
   * When climate dataset is changed, remove all threshold filters attached to datasets that
   * are different than the selected climate dataset.
   *
   * It is not possible to have a threshold filter on an enriched dataset if the enriched pf_dataset_id is different
   * than the one selected in a project
   */
  useEffect(() => {
    const dataIds = Object.keys(datasets);
    if (selectedClimateData && dataIds.length > 0) {
      const datasetsWithThreshold = checkIfDatasetsHaveFilter();
      dataIds.forEach((dataId, idx) => {
        if (
          filteredProjectDatasets[idx] &&
          datasetsWithThreshold[dataId].hasThresholdFilter &&
          filteredProjectDatasets[idx].pfDatasetId !== selectedClimateData.dataset.id
        ) {
          const filterName = getFilterName(degree, datasets[dataId], percentileValue);
          if (filterName) {
            const filterIdx = datasetsWithThreshold[dataId].originalFilterIdx;
            if (filterIdx !== -1) {
              dispatch(removeFilter(filterIdx));
            }
          }
        }
      });
    }
  }, [
    datasets,
    selectedClimateData,
    percentileValue,
    degree,
    filteredProjectDatasets,
    checkIfDatasetsHaveFilter,
    dispatch,
  ]);
};

export default useDatasetFilter;
