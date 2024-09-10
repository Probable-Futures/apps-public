export type StatisticsData = {
  datasetId: number;
  name: string;
  unit: string;
  warmingScenario: string;
  lowValue: string | number;
  midValue: string | number;
  highValue: string | number;
  longitude: number;
  latitude: number;
  info?: { [name: string]: any };
  mapCategory: string;
  x: number[];
  y: number[];
};
