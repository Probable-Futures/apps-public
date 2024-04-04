import { exportMapAsHTML, ExportProps } from "./exportMap";
import { getMap, getLatestMaps as getMaps, getDatasetIds as getIds } from "./getMapObject";

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

export { generateEmbedMap, getMapObject, getLatestMaps, getDatasetIds };
