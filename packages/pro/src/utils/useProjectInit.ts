import { useCallback, useEffect, useRef } from "react";
import { useApolloClient, useMutation } from "@apollo/client";
import { loadFiles, removeDataset } from "@kepler.gl/actions";
import { useNavigate } from "react-router-dom";

import {
  SET_FILTERED_PROJECT_DATASETS,
  SET_IMAGE_URL,
  SET_MAP_CONFIG,
  SET_PF_DATASET_ID,
  SET_PROJECT_DATASETS,
  SET_PROJECT_ID,
  SET_IS_FETCHING_DATASETS,
  SET_INITIALIZING_PROJECT,
  SET_ADDING_NEW_DATASET,
  SET_ADDED_DATA_TO_MAP,
  SET_FILE_SIZES,
  SET_PROJECT_NAME,
} from "../store/actions";
import { GET_PARTNER_PROJECT, GET_PF_PARTNER_PROJECT_DATASETS } from "../graphql/queries/projects";
import { fetchDatasets, filterDatasetsWithMultipleEnrichments, Project } from "./projectHelper";
import { PfPartnerProjectDatasets, ProjectDatasetNode } from "../shared/types";
import { GET_DATASET_SIGNED_URLS } from "../graphql/queries/datasets";
import { DEFAULT_PF_DATASET_ID, MAP_ID } from "../consts/MapConsts";
import { initialState } from "../store/reducers/projectReducer";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { PartnerDataset } from "./useProjectApi";

const useProjectInit = () => {
  const [getSignedUrls] = useMutation(GET_DATASET_SIGNED_URLS);
  const { keplerGl, project } = useAppSelector((state) => state);
  const apolloClient = useApolloClient();
  const dispatch = useAppDispatch();
  const keplerRef = useRef<any>();
  const navigate = useNavigate();

  useEffect(() => {
    keplerRef.current = keplerGl[MAP_ID];
  }, [keplerGl]);

  const fetchAndLoadFiles = useCallback(
    async (datasets: PartnerDataset[]) => {
      dispatch({ type: SET_IS_FETCHING_DATASETS, payload: { isFetchingDatasets: true } });
      try {
        const files = await fetchDatasets(datasets);
        dispatch({ type: SET_IS_FETCHING_DATASETS, payload: { isFetchingDatasets: false } });
        dispatch(loadFiles(files));
        dispatch({ type: SET_INITIALIZING_PROJECT, payload: { initializingProject: false } });
        dispatch({ type: SET_FILE_SIZES, payload: { fileSizes: files.map((file) => file.size) } });
      } catch (e) {
        dispatch({ type: SET_INITIALIZING_PROJECT, payload: { initializingProject: false } });
        dispatch({ type: SET_IS_FETCHING_DATASETS, payload: { isFetchingDatasets: false } });
      }
    },
    [dispatch],
  );

  const getSignedUrlsAndPassDatasetsToKepler = useCallback(
    async (partnerdatasets: PartnerDataset[]) => {
      const signedUrls = await getSignedUrls({
        variables: {
          fileUrls: partnerdatasets.map((partnerdataset) => partnerdataset.url),
        },
      });
      const datasetSignedUrls = signedUrls.data?.datasetSignedUrls;
      if (datasetSignedUrls) {
        await fetchAndLoadFiles(
          partnerdatasets.map((dataset, i) => ({
            url: datasetSignedUrls[i],
            name: dataset.name,
          })),
        );
      }
    },
    [getSignedUrls, fetchAndLoadFiles],
  );

  // this where we sign datasetUrls, fetch them from s3 and load them in kepler
  const initProject = useCallback(
    (
      pfDatasetId: number,
      projectDatasets: ProjectDatasetNode[],
      addingNewDataset: boolean,
      hardReload?: boolean,
    ) => {
      if (projectDatasets) {
        const filteredProjectDatasets = filterDatasetsWithMultipleEnrichments(
          projectDatasets,
          pfDatasetId,
        );
        // TODO: do not reload whole page
        if (!addingNewDataset && hardReload && filteredProjectDatasets.length > 1) {
          window.location.reload();
          return;
        }

        if (addingNewDataset && filteredProjectDatasets.length > 1) {
          dispatch({
            type: SET_ADDING_NEW_DATASET,
            payload: { addingNewDataset: true },
          });
        }
        dispatch({
          type: SET_FILTERED_PROJECT_DATASETS,
          payload: { filteredProjectDatasets },
        });
        let filteredProjectDatasetsFinal: ProjectDatasetNode[] = [];
        // if this is the first time the project is loaded
        if (project.filteredProjectDatasets.length === 0) {
          filteredProjectDatasetsFinal = filteredProjectDatasets;
        }
        // if a new dataset is added to the project
        else if (project.filteredProjectDatasets.length < filteredProjectDatasets.length) {
          filteredProjectDatasetsFinal.push(
            filteredProjectDatasets[filteredProjectDatasets.length - 1],
          );
        }
        // if an existing dataset has been enriched
        else if (keplerRef.current?.visState.datasets) {
          Object.keys(keplerRef.current.visState.datasets).forEach((dataId) => {
            dispatch(removeDataset(dataId));
          });
          filteredProjectDatasetsFinal = filteredProjectDatasets;
        }
        const partnerDatasets: PartnerDataset[] = [];
        filteredProjectDatasetsFinal.forEach((projectDataset) => {
          const url =
            projectDataset.enrichedDatasetFile ??
            projectDataset.processedWithCoordinatesFile ??
            projectDataset.originalFile;
          if (url) {
            const rootUrl = new URL(url);
            partnerDatasets.push({
              name: projectDataset.datasetName,
              url: decodeURIComponent(rootUrl.pathname).substring(1),
            });
          }
        });
        if (partnerDatasets.length) {
          getSignedUrlsAndPassDatasetsToKepler(partnerDatasets);
        } else {
          dispatch({ type: SET_INITIALIZING_PROJECT, payload: { initializingProject: false } });
        }
      }
    },
    [dispatch, getSignedUrlsAndPassDatasetsToKepler, project.filteredProjectDatasets],
  );

  const callInit = useCallback(
    async (
      projectId: string,
      pfDatasetId: number,
      addingNewDataset: boolean,
      hardReload?: boolean,
    ) => {
      dispatch({ type: SET_INITIALIZING_PROJECT, payload: { initializingProject: true } });
      dispatch({ type: SET_ADDED_DATA_TO_MAP, payload: { addedDataToMap: false } });
      const { data } = await apolloClient.query<PfPartnerProjectDatasets>({
        query: GET_PF_PARTNER_PROJECT_DATASETS,
        variables: {
          projectId,
        },
        fetchPolicy: "no-cache",
      });
      const projectDatasets = data?.viewPartnerProjectDatasets.nodes;

      if (projectDatasets) {
        if (projectDatasets.length === 0) {
          dispatch({ type: SET_ADDED_DATA_TO_MAP, payload: { addedDataToMap: true } });
        }
        dispatch({
          type: SET_PROJECT_DATASETS,
          payload: { projectDatasets },
        });
        initProject(pfDatasetId, projectDatasets, addingNewDataset, hardReload);
      } else {
        dispatch({ type: SET_INITIALIZING_PROJECT, payload: { initializingProject: false } });
      }
    },
    [apolloClient, dispatch, initProject],
  );

  const fetchProject = useCallback(
    async (id: string, init: boolean) => {
      const { data }: { data: { viewPartnerProject: Project } } = await apolloClient.query({
        query: GET_PARTNER_PROJECT,
        variables: {
          id,
        },
      });
      if (data && data.viewPartnerProject) {
        const pfDatasetId = data.viewPartnerProject.pfDatasetId || DEFAULT_PF_DATASET_ID;
        dispatch({
          type: SET_PROJECT_ID,
          payload: { projectId: data.viewPartnerProject.id },
        });
        dispatch({
          type: SET_IMAGE_URL,
          payload: { imageUrl: data.viewPartnerProject.imageUrl },
        });
        dispatch({
          type: SET_PROJECT_NAME,
          payload: { projectName: data.viewPartnerProject.name },
        });
        if (data.viewPartnerProject.mapConfig) {
          const config = { ...data.viewPartnerProject.mapConfig };
          if (!config.pfMapConfig) {
            config.pfMapConfig = {
              ...initialState.mapConfig.pfMapConfig,
              warmingScenario: initialState?.mapConfig?.pfMapConfig?.warmingScenario ?? 1,
            };
          } else {
            config.pfMapConfig = { ...initialState.mapConfig.pfMapConfig, ...config.pfMapConfig };
          }
          dispatch({
            type: SET_MAP_CONFIG,
            payload: { mapConfig: config },
          });
        }
        dispatch({
          type: SET_PF_DATASET_ID,
          payload: { pfDatasetId: pfDatasetId },
        });
        init && callInit(id, pfDatasetId, false);
      } else {
        navigate("/not-found");
      }
    },
    [apolloClient, navigate, dispatch, callInit],
  );

  return { fetchProject, callInit, fetchAndLoadFiles };
};

export default useProjectInit;
