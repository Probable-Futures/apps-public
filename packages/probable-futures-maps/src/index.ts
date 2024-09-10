import { exportMapAsHTML, ExportProps } from "./exportMap";
import { getMap, getLatestMaps as getMaps, getDatasetIds as getIds } from "./getMapObject";
import { dataDescriptionAtPlaceMappingByDatasetId } from "./dataDescriptionAtPlace";

function generateEmbedMap(props: ExportProps) {
  return exportMapAsHTML(props);
}

function getMapObject(datasetId: number) {
  return getMap(datasetId);
}

function getLatestMaps() {
  return getMaps();
}

function getDatasetIds() {
  return getIds();
}

function getDataDescriptionAtPlaceGenerator() {
  return dataDescriptionAtPlaceMappingByDatasetId;
}

export {
  generateEmbedMap,
  getMapObject,
  getLatestMaps,
  getDatasetIds,
  getDataDescriptionAtPlaceGenerator,
};

export { default as Chart } from "./react-components/chart/Chart";
