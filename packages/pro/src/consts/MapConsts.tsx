export const MAP_ID = "heat-map";

export const supportLayerTypes = ["point", "heatmap", "geojson"];
export const DEFAULT_PF_DATASET_ID = 40104;

export const DEGREES = [0.5, 1, 1.5, 2, 2.5, 3];
export const DATA_VALUES = ["mid", "high", "low"];

export const mapOldDataValuesToNewOnes: Record<string, string> = {
  data_baseline_pctl10: "data_baseline_low",
  data_baseline_mean: "data_baseline_mid",
  data_baseline_pctl90: "data_baseline_high",
  data_1c_pctl10: "data_1c_low",
  data_1c_mean: "data_1c_mid",
  data_1c_pctl90: "data_1c_high",
  data_1_5c_pctl10: "data_1_5c_low",
  data_1_5c_mean: "data_1_5c_mid",
  data_1_5c_pctl90: "data_1_5c_high",
  data_2c_pctl10: "data_2c_low",
  data_2c_mean: "data_2c_mid",
  data_2c_pctl90: "data_2c_high",
  data_2_5c_pctl10: "data_2_5c_low",
  data_2_5c_mean: "data_2_5c_mid",
  data_2_5c_pctl90: "data_2_5c_high",
  data_3c_pctl10: "data_3c_low",
  data_3c_mean: "data_3c_mid",
  data_3c_pctl90: "data_3c_high",
};
