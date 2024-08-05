import { exportMapAsHTML, ExportProps } from "./exportMap";
import { getMap, getLatestMaps as getMaps, getDatasetIds as getIds } from "./getMapObject";
import { magicSentenceMappingByDatasetId } from "./magicSentence";

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

function getMagicSentenceGenerator() {
  return magicSentenceMappingByDatasetId;
}

export { generateEmbedMap, getMapObject, getLatestMaps, getDatasetIds, getMagicSentenceGenerator };
