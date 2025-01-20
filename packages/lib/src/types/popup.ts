import { DegreeDataKeys } from "../consts";

type Data = {
  mid?: number;
  low?: number;
  high?: number;
};

export type MapEvent = {
  lngLat: [number, number];
  features?: Array<any>;
  target?: any;
};

export type PopupFeature = {
  latitude: number;
  longitude: number;
  selectedField: DegreeDataKeys;
  selectedData: Data;
  data_baseline_mid?: number;
  data_baseline_low?: number;
  data_baseline_high?: number;
  data_baseline_absolute_mid?: number;
  data_baseline_absolute_low?: number;
  data_baseline_absolute_high?: number;
  data_1c_mid?: number;
  data_1c_low?: number;
  data_1c_high?: number;
  data_1_5c_mid?: number;
  data_1_5c_low?: number;
  data_1_5c_high?: number;
  data_2c_mid?: number;
  data_2c_low?: number;
  data_2c_high?: number;
  data_2_5c_mid?: number;
  data_2_5c_low?: number;
  data_2_5c_high?: number;
  data_3c_mid?: number;
  data_3c_low?: number;
  data_3c_high?: number;
  x?: number;
  y?: number;
};
