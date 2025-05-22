export const ERROR_VALUE = -99999;
export const BARREN_LAND_VALUE = -88888;
export const MIN_ZOOM = 2.2;
export const MIN_ZOOM_3 = 3;
export const MAX_ZOOM = 10;
export const INITIAL_ZOOM = MIN_ZOOM;
export const DATA_LAYER_ID_PREFIX = "region-";

export type RecentlySearchedItemsKey = {
  en: string;
  zh: string;
  es: string;
  fr: string;
};

export const LOCAL_STORAGE_RECENTLY_SEARCHED_ITEMS_KEY: RecentlySearchedItemsKey = {
  en: "recentlySearched",
  zh: "recentlySearchedZH",
  es: "recentlySearchedES",
  fr: "recentlySearchedFR",
};

export type DegreeDataKeys =
  | "data_baseline"
  | "data_1c"
  | "data_1_5c"
  | "data_2c"
  | "data_2_5c"
  | "data_3c";

export type DescKeys =
  | "description_baseline"
  | "description_1c"
  | "description_15c"
  | "description_2c"
  | "description_25c"
  | "description_3c";

export type Degrees = {
  value: number;
  label: string;
  dataKey: DegreeDataKeys;
  descKey: DescKeys;
  year: string;
};

export const degreesOptions: Degrees[] = [
  {
    value: 0.5,
    label: "0.5°C",
    dataKey: "data_baseline",
    descKey: "description_baseline",
    year: "Past",
  },
  {
    value: 1,
    label: "1°C",
    dataKey: "data_1c",
    descKey: "description_1c",
    year: "Recent",
  },
  {
    value: 1.5,
    label: "1.5°C",
    dataKey: "data_1_5c",
    descKey: "description_15c",
    year: "Current",
  },
  {
    value: 2,
    label: "2°C",
    dataKey: "data_2c",
    descKey: "description_2c",
    year: "Potential",
  },
  {
    value: 2.5,
    label: "2.5°C",
    dataKey: "data_2_5c",
    descKey: "description_25c",
    year: "Potential",
  },
  {
    value: 3,
    label: "3°C",
    dataKey: "data_3c",
    descKey: "description_3c",
    year: "Potential",
  },
];

export const interactiveClimateLayerIds = [
  "region-as-oc-1",
  "region-as-oc-2",
  "region-as-oc-3",
  "region-as-oc-4",
  "region-as-oc-5",
  "region-as-oc-6",
  "region-as-oc-7",
  "region-as-oc-8",
  "region-eu-af-1",
  "region-eu-af-2",
  "region-eu-af-3",
  "region-eu-af-4",
  "region-eu-af-5",
  "region-eu-af-6",
  "region-eu-af-7",
  "region-eu-af-8",
  "region-na-sa-1",
  "region-na-sa-2",
  "region-na-sa-3",
  "region-na-sa-4",
  "region-na-sa-5",
  "region-na-sa-6",
  "region-eu-af-9",
  "region-na-sa-7",
];

export const MAP_VERSION_URL = "https://probablefutures.org/map-version-history";
export const LOCAL_STORAGE_WARMING_SCENARIOS_VISITED_KEY = "warmingScenariosVisited";

export const datasetsWithMidValuesOnly = [40612, 40613, 40701, 40702, 40901];
