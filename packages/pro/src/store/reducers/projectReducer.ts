import { AnyAction } from "redux";

import { ProjectDatasetNode } from "../../shared/types";
import { MapConfig, ClickedMapInfo } from "../../utils/projectHelper";
import {
  UPDATE_PROJECT_SYNCED,
  SET_IS_FETCHING_DATASETS,
  UPDATE_CLICKED_MAP_INFO,
  SET_PF_DATASET_ID,
  SET_PROJECT_DATASETS,
  SET_ADDED_DATA_TO_MAP,
  SET_FILTERED_PROJECT_DATASETS,
  SET_PROJECT_ID,
  SET_IMAGE_URL,
  SET_MAP_CONFIG,
  SET_PF_DATASET_ID_KEPLER_IDX_MAP,
  SET_INITIALIZING_PROJECT,
  SET_SLUG_ID,
  SET_ADDING_NEW_DATASET,
  SET_DATASET_ENRICHMENT,
  CLEAR_DATASET_ENRICHMENT,
  SET_FILE_SIZES,
  UPDATE_PARTNER_DATASET_NAME,
  SET_PROJECT_NAME,
} from "../actions";
import { EnrichStatus } from "../../utils/useEnrichmentProcess";

export type ProjectState = {
  pfDatasetId?: number;
  projectId: string;
  imageUrl: string;
  mapConfig: MapConfig;
  slugId: string;
  addedDataToMap: boolean;
  isFetchingDatasets: boolean;
  clickedMapInfo?: ClickedMapInfo;
  filteredProjectDatasets: ProjectDatasetNode[];
  projectDatasets: ProjectDatasetNode[];
  isSynced: boolean;
  pfDatasetIdKeplerDataIdxMap: Record<string, string>;
  datasetEnrichment: {
    processingStatus?: EnrichStatus;
    enrichmentStatus?: EnrichStatus;
    index?: number;
    pfDatasetId?: number;
    processedWithCoodridatesRowCount?: number;
    enrichmentProgress: number;
    forceNewEnrichment?: boolean;
  };
  initializingProject: boolean;
  addingNewDataset: boolean;
  fileSizes: number[];
  projectName: string;
};

export const initialState: ProjectState = {
  isSynced: true,
  isFetchingDatasets: false,
  clickedMapInfo: undefined,
  pfDatasetId: undefined,
  projectDatasets: [],
  filteredProjectDatasets: [],
  addedDataToMap: false,
  projectId: "",
  slugId: "",
  imageUrl: "",
  mapConfig: {
    pfMapConfig: {
      percentileValue: "mid",
      warmingScenario: 1,
      showLabels: true,
      showBorders: true,
    },
  },
  pfDatasetIdKeplerDataIdxMap: {},
  datasetEnrichment: {
    enrichmentProgress: 0,
  },
  initializingProject: false,
  addingNewDataset: false,
  fileSizes: [],
  projectName: "",
};

const projectReducer = (state: ProjectState = initialState, action: AnyAction): ProjectState => {
  switch (action.type) {
    case UPDATE_PROJECT_SYNCED:
      return {
        ...state,
        isSynced: action.payload.isSynced,
      };
    case SET_IS_FETCHING_DATASETS:
      return {
        ...state,
        isFetchingDatasets: action.payload.isFetchingDatasets,
      };
    case UPDATE_CLICKED_MAP_INFO:
      return {
        ...state,
        clickedMapInfo: action.payload.clickedMapInfo,
      };
    case SET_PF_DATASET_ID:
      return {
        ...state,
        pfDatasetId: action.payload.pfDatasetId,
      };
    case SET_PROJECT_DATASETS:
      return {
        ...state,
        projectDatasets: action.payload.projectDatasets,
      };
    case SET_ADDED_DATA_TO_MAP:
      return {
        ...state,
        addedDataToMap: action.payload.addedDataToMap,
      };
    case SET_FILTERED_PROJECT_DATASETS:
      return {
        ...state,
        filteredProjectDatasets: action.payload.filteredProjectDatasets,
      };
    case SET_PROJECT_ID:
      return {
        ...state,
        projectId: action.payload.projectId,
      };
    case SET_IMAGE_URL:
      return {
        ...state,
        imageUrl: action.payload.imageUrl,
      };
    case SET_MAP_CONFIG:
      return {
        ...state,
        mapConfig: action.payload.mapConfig,
      };
    case SET_PF_DATASET_ID_KEPLER_IDX_MAP:
      return {
        ...state,
        pfDatasetIdKeplerDataIdxMap: action.payload.pfDatasetIdKeplerDataIdxMap,
      };
    case SET_DATASET_ENRICHMENT:
      return {
        ...state,
        datasetEnrichment: { ...state.datasetEnrichment, ...action.payload.datasetEnrichment },
      };
    case SET_SLUG_ID:
      return {
        ...state,
        slugId: action.payload.slugId,
      };
    case SET_INITIALIZING_PROJECT:
      return {
        ...state,
        initializingProject: action.payload.initializingProject,
      };
    case SET_ADDING_NEW_DATASET:
      return {
        ...state,
        addingNewDataset: action.payload.addingNewDataset,
      };
    case CLEAR_DATASET_ENRICHMENT:
      return {
        ...state,
        datasetEnrichment: { ...initialState.datasetEnrichment },
      };
    case SET_FILE_SIZES:
      return {
        ...state,
        fileSizes: action.payload.fileSizes,
      };
    case UPDATE_PARTNER_DATASET_NAME:
      return {
        ...state,
        filteredProjectDatasets: state.filteredProjectDatasets.map((dataset, index) =>
          index === action.payload.index
            ? { ...dataset, datasetName: action.payload.datasetName }
            : dataset,
        ),
      };
    case SET_PROJECT_NAME:
      return {
        ...state,
        projectName: action.payload.projectName,
      };
    default:
      return state;
  }
};

export default projectReducer;
