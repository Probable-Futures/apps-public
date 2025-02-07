import { datasets } from "@probable-futures/lib";

export const getMap = (datasetId: number) => {
  return datasets.find((dataset) => dataset.dataset.id === datasetId && dataset.isLatest);
};

export const getLatestMaps = () => {
  return datasets.filter((dataset) => dataset.isLatest);
};

export const getDatasetIds = () => {
  return getLatestMaps().map((dataset) => dataset.dataset.id);
};
