import { getMapObject } from ".";
import { daysAboveMaps } from "./consts/dataDescriptionAtPlace";

const parseToInt = (value: number | string) =>
  typeof value === "string" ? parseInt(value) : parseInt(value.toString());

type FuncArgs = {
  place: string;
  valueLow: string | number;
  valueMid: string | number;
  valueHigh: string | number;
  degree: number;
  datasetId: number;
};

export type DataDescriptionAtPlaceFuncType = (args: FuncArgs) => string;

const getArticle = (word: string) => (/^[aeiou]/i.test(word) ? "an" : "a");

const daysAboveFunc = ({ place, valueLow, valueMid, valueHigh, degree, datasetId }: FuncArgs) => {
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
    degree === 0.5 ? "Between 1970 and 2000" : `In a ${degree}°C warming scenario`
  }, people in ${place} could expect about ${parseToInt(valueMid)} ${mapName} in ${getArticle(
    dataLabels[1],
  )} ${dataLabels[1].toLowerCase()}, ${parseToInt(valueLow)} ${unit} in ${getArticle(
    dataLabels[0],
  )} ${dataLabels[0].toLowerCase()} and ${parseToInt(valueHigh)} ${unit} in ${getArticle(
    dataLabels[2],
  )} ${dataLabels[2].toLowerCase()}.`;
};

export const dataDescriptionAtPlaceMappingByDatasetId = (function () {
  const result = daysAboveMaps.reduce<Record<number, DataDescriptionAtPlaceFuncType>>(
    (prev, cur) => {
      prev[cur] = daysAboveFunc;
      return prev;
    },
    {} as Record<number, DataDescriptionAtPlaceFuncType>,
  );

  return result;
})();
