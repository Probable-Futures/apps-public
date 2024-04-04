import { utils } from "@probable-futures/lib";

import { ParsedConfig, ParsedLayer } from "../types/schemas/schema-manager";
import { TooltipField } from "../types/reducers/vis-state-updaters";
import { mapOldDataValuesToNewOnes, supportLayerTypes } from "../consts/MapConsts";
import { AddDataToMapPayload } from "../types/actions";
import { ProjectDatasetNode } from "../shared/types";
import { PartnerDataset } from "./useProjectApi";

export type PfMapConfig = {
  percentileValue: utils.BinningType;
  warmingScenario: number;
  showLabels: boolean;
  showBorders: boolean;
  bins?: number[];
};

export type KeplerConfig = {
  config: ParsedConfig;
  version: string;
};

export type MapConfig = {
  keplerConfig?: KeplerConfig;
  pfMapConfig: PfMapConfig;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  mapConfig?: MapConfig;
  imageUrl?: string;
  pfDatasetId?: number;
};

export type UpdateProjectParams = {
  mapStyleConfig?: {
    key: keyof PfMapConfig;
    value: utils.BinningType | number[] | number | boolean;
  };
  keplerConfig?: KeplerConfig;
  pfDatasetId?: number;
  imageUrl?: string;
  erasePfMapConfig?: boolean;
  eraseKeplerConfig?: boolean;
};

export type ClickedMapInfo = {
  color: string;
  coordinate: number[];
  index: number;
  layer: any;
  lngLat: number[];
  object: any;
  x: number;
  y: number;
};

// clean filters array because passing filters to kepler without name or value will break the ui
const removeEmptyFilters = (dataToMapPayload: AddDataToMapPayload) => {
  if (
    dataToMapPayload.config &&
    dataToMapPayload.config.visState?.filters &&
    dataToMapPayload.config.visState?.filters.length > 0
  ) {
    dataToMapPayload.config.visState.filters = dataToMapPayload.config.visState.filters.filter(
      (filter) => filter.name?.length && filter.value != null,
    );
  }
  return dataToMapPayload;
};

// Old data attributes are replaced with new names. For example, `data_1c_mean` becomes `data_1c_mid` and
// `data_2_5c_pctl10` becomes `data_2_5c_low`. So we need this function for backward compatibility.
const replaceOldDataValues = (dataToMapPayload: AddDataToMapPayload) => {
  if (Array.isArray(dataToMapPayload.datasets)) {
    dataToMapPayload.datasets.map((dataset) => {
      dataset.data.fields = dataset.data.fields.map((field) => {
        field.id =
          field.id && mapOldDataValuesToNewOnes[field.id]
            ? mapOldDataValuesToNewOnes[field.id]
            : field.id;
        field.name =
          field.name && mapOldDataValuesToNewOnes[field.name]
            ? mapOldDataValuesToNewOnes[field.name]
            : field.name;
        field.displayName =
          field.displayName && mapOldDataValuesToNewOnes[field.displayName]
            ? mapOldDataValuesToNewOnes[field.displayName]
            : field.displayName;

        return field;
      });
      return dataset;
    });
  }
  return dataToMapPayload;
};

export const cleanKeplerConfig = (dataToMapPayload: AddDataToMapPayload) => {
  return replaceOldDataValues(removeEmptyFilters(dataToMapPayload));
};

export const findDataId = (n: number, layers: ParsedLayer[]) => {
  const set = new Set<string>();
  layers.forEach((layer) => {
    if (layer.type && supportLayerTypes.includes(layer.type) && layer.config?.dataId) {
      set.add(layer.config.dataId);
    }
  });
  return set;
};

export const getDefaultTooltipFields = (
  fieldsToShow: { [key: string]: TooltipField[] },
  dataId?: string,
) => {
  Object.keys(fieldsToShow).forEach((key) => {
    if (!dataId || (dataId && dataId === key)) {
      fieldsToShow[key] = fieldsToShow[key].filter(
        (field) =>
          !field.name.startsWith("__pf") &&
          !field.name.startsWith("data_1c") &&
          !field.name.startsWith("data_1_5_c") &&
          !field.name.startsWith("data_2c") &&
          !field.name.startsWith("data_2_5_c") &&
          !field.name.startsWith("data_3c"),
      );
    }
  });
  return fieldsToShow;
};

const getUniqueLayersIdxByDataId = (layers: ParsedLayer[]) => {
  const idxs: number[] = [];
  let dataIds = new Set();

  layers.forEach((layer, index) => {
    if (layer.config?.dataId && !dataIds.has(layer.config.dataId)) {
      dataIds.add(layer.config.dataId);
      idxs.push(index);
    }
  });

  return idxs;
};

export const mergeLayers = (
  originalLayers?: ParsedLayer[],
  savedLayers?: ParsedLayer[],
): ParsedLayer[] | undefined => {
  if (originalLayers && savedLayers) {
    const uniqueOriginalLayersIdxByDataId = getUniqueLayersIdxByDataId(originalLayers);
    const uniqueNewLayerIdxsByDataId = getUniqueLayersIdxByDataId(savedLayers);
    const result: ParsedLayer[] = [];
    uniqueOriginalLayersIdxByDataId.forEach((layerIdx, index) => {
      if (uniqueNewLayerIdxsByDataId[index] !== undefined) {
        result.push({
          ...originalLayers[layerIdx],
          ...savedLayers[uniqueNewLayerIdxsByDataId[index]],
        });
      }
    });

    return result;
  }
  return originalLayers;
};

export const filterDatasetsWithMultipleEnrichments = (
  partnerDatasets: ProjectDatasetNode[],
  pfDatasetId: number,
) => {
  const oneUploadPerDatasetGroup = partnerDatasets.reduce<Record<string, ProjectDatasetNode>>(
    (prev, curr) => {
      if (!prev[curr.datasetId]) {
        prev[curr.datasetId] = curr;
      } else if (curr.pfDatasetId === pfDatasetId) {
        prev[curr.datasetId] = curr;
      }
      return prev;
    },
    {},
  );

  return Object.keys(oneUploadPerDatasetGroup).map(
    (datasetId) => oneUploadPerDatasetGroup[datasetId],
  );
};

export const fetchDatasets = async (datasets: PartnerDataset[]) => {
  const files: File[] = [];
  for (let i = 0; i < datasets.length; i++) {
    const dataset = datasets[i];
    const file = await fetch(dataset.url, {
      method: "GET",
    });
    const blob = await file.blob();
    const url = new URL(dataset.url);
    files.push(
      new File([blob], dataset.name, {
        type: url.searchParams.get("response-content-type") ?? "text/csv",
      }),
    );
  }

  return files;
};
