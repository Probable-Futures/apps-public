import { createAction } from "@reduxjs/toolkit";

const HIDE_SIDE_BAR = "HIDE_SIDE_BAR";
export const hideSideBar = createAction(HIDE_SIDE_BAR);

export const UPDATE_PROJECT_SYNCED = "UPDATE_PROJECT_SYNCED";
export const updateProjectSynced = createAction(UPDATE_PROJECT_SYNCED);

export const SET_IS_FETCHING_DATASETS = "SET_IS_FETCHING_DATASETS";
export const setIsFetchingDatasets = createAction(SET_IS_FETCHING_DATASETS);

export const UPDATE_CLICKED_MAP_INFO = "UPDATE_CLICKED_MAP_INFO";
export const updateClickedArea = createAction(UPDATE_CLICKED_MAP_INFO);

export const SET_PF_DATASET_ID = "SET_PF_DATASET_ID";
export const setPfDatasetId = createAction(SET_PF_DATASET_ID);

export const SET_PROJECT_DATASETS = "SET_PROJECT_DATASETS";
export const setProjectDatasets = createAction(SET_PROJECT_DATASETS);

export const SET_ADDED_DATA_TO_MAP = "SET_ADDED_DATA_TO_MAP";
export const setShouldAddDataToMap = createAction(SET_ADDED_DATA_TO_MAP);

export const SET_FILTERED_PROJECT_DATASETS = "SET_FILTERED_PROJECT_DATASETS";
export const setFitleredProjectDatasets = createAction(SET_FILTERED_PROJECT_DATASETS);

export const UPDATE_PARTNER_DATASET_NAME = "UPDATE_PARTNER_DATASET_NAME";
export const updatePartnerDatasetName = createAction(UPDATE_PARTNER_DATASET_NAME);

export const SET_PROJECT_ID = "SET_PROJECT_ID";
export const setProjectId = createAction(SET_PROJECT_ID);

export const SET_SLUG_ID = "SET_SLUG_ID";
export const setSlugId = createAction(SET_SLUG_ID);

export const SET_IMAGE_URL = "SET_IMAGE_URL";
export const setImageUrl = createAction(SET_IMAGE_URL);

export const SET_MAP_CONFIG = "SET_MAP_CONFIG";
export const setMapConfig = createAction(SET_MAP_CONFIG);

export const SET_PF_DATASET_ID_KEPLER_IDX_MAP = "SET_PF_DATASET_ID_KEPLER_IDX_MAP";
export const setPfDatasetIdKeplerDataIdxMap = createAction(SET_PF_DATASET_ID_KEPLER_IDX_MAP);

export const SET_DATASET_ENRICHMENT = "SET_DATASET_ENRICHMENT";
export const setDatasetEnrichment = createAction(SET_DATASET_ENRICHMENT);

export const CLEAR_DATASET_ENRICHMENT = "CLEAR_DATASET_ENRICHMENT";
export const clearDatasetEnrichment = createAction(CLEAR_DATASET_ENRICHMENT);

export const SET_INITIALIZING_PROJECT = "SET_INITIALIZING_PROJECT";
export const setInitializingProject = createAction(SET_INITIALIZING_PROJECT);

export const SET_ADDING_NEW_DATASET = "SET_ADDING_NEW_DATASET";
export const setAddingNewDataset = createAction(SET_ADDING_NEW_DATASET);

export const SET_FILE_SIZES = "SET_FILE_SIZES";
export const setFileSizes = createAction(SET_FILE_SIZES);

export const SET_PROJECT_NAME = "SET_PROJECT_NAME";
export const setProjectName = createAction(SET_PROJECT_NAME);
