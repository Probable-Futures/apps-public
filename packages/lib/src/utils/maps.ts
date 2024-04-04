import { ClimateZoneSubGroup, DatasetDescriptionResponse } from "../types";

export function getLabelByValue(
  value: number,
  binningType: string,
  binningLabels: string[],
  stops: number[],
) {
  if (binningType === "range") {
    let labelIdx = -1;
    stops.forEach((stop, index) => {
      if (labelIdx === -1) {
        if (index === 0 && value < stop) {
          labelIdx = 0;
        } else {
          const range = [stops[index - 1], stop];
          if (value >= range[0] && value < range[1]) {
            labelIdx = index;
          }
        }
      }
    });
    if (labelIdx === -1 && value >= stops[stops.length - 1]) {
      labelIdx = stops.length;
    }
    return binningLabels[labelIdx];
  } else if (binningType === "number") {
    let labelIdx = 0;
    stops.forEach((stop, index) => {
      if (stop === value) {
        labelIdx = index + 1;
      }
    });
    return binningLabels[labelIdx];
  }
}

export function getClimateZoneByValue(
  datasetDescriptionResponse: DatasetDescriptionResponse,
  midValue: number,
) {
  let climateZoneSubGroup: ClimateZoneSubGroup | undefined;
  datasetDescriptionResponse.climate_zones?.forEach((climateZonesDescription) => {
    climateZonesDescription.list.forEach((climateZone) => {
      if (parseInt(climateZone.value) === midValue) {
        climateZoneSubGroup = climateZone;
      }
    });
  });
  return climateZoneSubGroup;
}
