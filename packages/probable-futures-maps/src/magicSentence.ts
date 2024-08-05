import { getMapObject } from ".";
import { daysAboveMaps } from "./consts/magicSentence";

const parseToInt = (value: number | string) =>
  typeof value === "string" ? parseInt(value) : parseInt(value.toString());

type FuncArgs = {
  place: string;
  value1Low: string | number;
  value1Mid: string | number;
  value1High: string | number;
  value2Low: string | number;
  value2Mid: string | number;
  value2High: string | number;
  degree1: number;
  degree2: number;
  datasetId: number;
};

export type MagicSentenceFuncType = (args: FuncArgs) => string;

const getArticle = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

const daysAboveFunc = ({
  place,
  value1Low,
  value1Mid,
  value1High,
  value2Low,
  value2Mid,
  value2High,
  degree1,
  degree2,
  datasetId,
}: FuncArgs) => {
  const mapObject = getMapObject(datasetId);
  if (!mapObject) {
    throw Error(`Dataset ${datasetId} was not found`);
  }
  const {
    name: mapName,
    dataLabels,
    dataset: { unit },
  } = mapObject;
  return `${
    degree1 === 0.5 ? "Between 1970 and 2000" : `In a ${degree1}°C warming scenario`
  }, people in ${place} could expect about ${parseToInt(value1Mid)} ${mapName} in ${getArticle(
    dataLabels[1],
  )} ${dataLabels[1]}, ${parseToInt(value1Low)} ${unit} in ${getArticle(dataLabels[0])} ${
    dataLabels[0]
  } and ${parseToInt(value1High)} ${unit} in ${getArticle(dataLabels[2])} ${
    dataLabels[2]
  }. In a ${degree2}°C warming scenario, people in ${place} can expect about ${parseToInt(
    value2Mid,
  )} ${mapName} in ${getArticle(dataLabels[1])} ${dataLabels[1]}, ${parseToInt(
    value2Low,
  )} ${unit} in ${getArticle(dataLabels[0])} ${dataLabels[0]} and ${parseToInt(
    value2High,
  )} ${unit} in ${getArticle(dataLabels[2])} ${dataLabels[2]}.`;
};

export const magicSentenceMappingByDatasetId = (function () {
  const result = daysAboveMaps.reduce<Record<number, MagicSentenceFuncType>>((prev, cur) => {
    prev[cur] = daysAboveFunc;
    return prev;
  }, {} as Record<number, MagicSentenceFuncType>);

  return result;
})();
