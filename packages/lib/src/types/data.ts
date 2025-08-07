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
  values: number[];
  cumulativeProbability: number[];
};

export type Resource = {
  description: string;
  resource: {
    title: string;
    url: string;
    target: string;
  };
};

export type AboutMapResources = {
  explore_heading: string;
  explore_subheading: string;
  related_heading: string;
  related_subheading: string;
  resources: Resource[];
  data_resources: Resource[];
  warming_scenario_description: string;
};
