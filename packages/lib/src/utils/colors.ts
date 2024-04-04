import { ERROR_VALUE, BARREN_LAND_VALUE } from "../consts/mapConsts";
import { convertCToF, convertmmToin } from "./unit";

type Color = {
  r: number;
  g: number;
  b: number;
};

export type BinningType = "mid" | "high" | "low";

export const rgbToHex = (r: number, g: number, b: number): string =>
  "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

export const interpolateColors = (startColor: Color, endColor: Color) => {
  const newColors = [];
  if (startColor && endColor) {
    newColors.push(rgbToHex(startColor.r, startColor.g, startColor.b));

    for (let i = 0; i < 4; i++) {
      const red = Math.round((endColor.r - startColor.r) * (0.2 * (i + 1)) + startColor.r);
      const green = Math.round((endColor.g - startColor.g) * (0.2 * (i + 1)) + startColor.g);
      const blue = Math.round((endColor.b - startColor.b) * (0.2 * (i + 1)) + startColor.b);
      newColors.push(rgbToHex(red, green, blue));
    }
    newColors.push(rgbToHex(endColor.r, endColor.g, endColor.b));
  }
  return newColors;
};

const getDataAttribute = (degrees: number, percentileValue: BinningType) => {
  if (degrees === 0.5) {
    return `data_baseline_${percentileValue}`;
  } else {
    return `data_${degrees.toString().replace(".", "_")}c_${percentileValue}`;
  }
};

export const getMapLayerColors = (
  colors: string[],
  bins: number[],
  degrees: number,
  percentileValue: BinningType = "mid",
) => {
  const dataAttribute = getDataAttribute(degrees, percentileValue);
  const startIndex = 5;
  const additionalBins = colors
    .slice(startIndex)
    .map((_, index) => [bins[startIndex + index - 1], colors[startIndex + index]]);

  return [
    "step",
    ["get", dataAttribute],
    // color the areas with error values the same as the ocean color
    "#f5f5f5",
    ERROR_VALUE + 1,
    "#e6e6e6",
    BARREN_LAND_VALUE + 1,
    colors[0],
    bins[0],
    colors[1],
    bins[1],
    colors[2],
    bins[2],
    colors[3],
    bins[3],
    colors[4],
    ...additionalBins.flat(),
  ];
};

export function getBinLabel(
  bins: number[],
  index: number,
  unit: string,
  minValue: number,
  maxValue: number,
  step: number,
  tempUnit?: string,
  isDiff = false,
  isFrequent = false,
  precipitationUnit?: string,
  isPrecipitationMap?: boolean,
): string[] {
  const isTempMap = unit.toLowerCase().includes("temp");

  let finalBins = bins;
  let finalMinValue = minValue;
  let finalMaxValue = maxValue;
  if (isTempMap && tempUnit === "°F") {
    finalBins = convertCToF(bins) as number[];
    finalMinValue = convertCToF(minValue) as number;
    finalMaxValue = convertCToF(maxValue) as number;
  } else if (isPrecipitationMap && precipitationUnit === "in") {
    finalBins = convertmmToin(bins) as number[];
    finalMinValue = convertmmToin(minValue) as number;
    finalMaxValue = convertmmToin(maxValue) as number;
  }
  const plusSign = isDiff && !isFrequent ? "+" : "";
  const prevBin = finalBins[index - 1];
  const curBin = finalBins[index];

  if (index > bins.length) {
    return [];
  }

  if (index === 0) {
    if (finalMinValue === 0 && finalMinValue === finalBins[index] - 1 && !isDiff) {
      return [finalMinValue.toString()];
    } else if (!isDiff) {
      return [finalMinValue.toString(), parseFloat((curBin - step).toFixed(1)).toString()];
    } else {
      return [curBin > 0 ? `< ${plusSign.concat(curBin.toString())}` : `< ${curBin}`];
    }
  }

  if (!isDiff) {
    const firstBin = prevBin.toString();
    let secondBin = "";

    if (index === finalBins.length) {
      secondBin = finalMaxValue.toString();
    } else {
      secondBin = parseFloat((curBin - step).toFixed(1)).toString();
    }
    return [firstBin, secondBin];
  } else {
    if (index === finalBins.length) {
      return [
        prevBin - step > 0
          ? `> ${plusSign.concat(parseFloat((prevBin - step).toFixed(1)).toString())}`
          : `> ${parseFloat((prevBin - step).toFixed(1)).toString()}`,
      ];
    } else {
      if (prevBin === curBin - step) {
        return [prevBin > 0 ? plusSign.concat(prevBin.toString()) : prevBin.toString()];
      } else {
        return [
          prevBin > 0 ? plusSign.concat(prevBin.toString()) : prevBin.toString(),
          curBin - step > 0
            ? plusSign.concat(parseFloat((curBin - step).toFixed(1)).toString())
            : parseFloat((curBin - step).toFixed(1)).toString(),
        ];
      }
    }
  }
}

export const getBinLabelArray = (
  bins: number[],
  index: number,
  minValue: number,
  maxValue: number,
  step: number,
) => {
  if (index === 0) {
    return [minValue, parseFloat((bins[index] - step).toFixed(1))];
  }

  return [
    bins[index - 1],
    index === bins.length ? maxValue : parseFloat((bins[index] - step).toFixed(1)),
  ];
};
