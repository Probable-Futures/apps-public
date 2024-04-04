import { useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { useLocation } from "react-router-dom";

import { hideSideBar, SET_PF_DATASET_ID, SET_MAP_CONFIG } from "../store/actions";
import { PROJECT_SHARE_ID_QUERY_PARAM } from "../consts/dashboardConsts";
import { GET_PARTNER_PROJECT_SHARE } from "../graphql/queries/projects";
import { initialState } from "../store/reducers/projectReducer";
import { DEFAULT_PF_DATASET_ID } from "../consts/MapConsts";
import { GRAPHQL_API_KEY } from "../consts/env";
import { useAppDispatch } from "../app/hooks";
import { MapConfig } from "./projectHelper";
import useProjectInit from "./useProjectInit";

export type ProjectShare = {
  mapConfig: MapConfig;
  files: { name: string; url: string }[];
  pfDatasetId: number;
};

const useShareProjectApi = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { fetchAndLoadFiles } = useProjectInit();

  const [getPartnerProjectShare, { data: projectShare, error }] = useLazyQuery<{
    projectSharedData: ProjectShare;
  }>(GET_PARTNER_PROJECT_SHARE, {
    context: {
      headers: {
        "api-key": GRAPHQL_API_KEY,
      },
    },
  });

  useEffect(() => {
    if (projectShare) {
      if (projectShare.projectSharedData.mapConfig) {
        const config = { ...projectShare.projectSharedData.mapConfig };
        if (!config.pfMapConfig) {
          config.pfMapConfig = { ...initialState.mapConfig.pfMapConfig };
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
        payload: {
          pfDatasetId: projectShare.projectSharedData.pfDatasetId || DEFAULT_PF_DATASET_ID,
        },
      });
      fetchAndLoadFiles(projectShare.projectSharedData.files);
    }
  }, [projectShare, dispatch, fetchAndLoadFiles]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const slugId = queryParams.get(PROJECT_SHARE_ID_QUERY_PARAM) || "";
    if (slugId) {
      getPartnerProjectShare({
        variables: {
          slugId,
        },
      });
      dispatch(hideSideBar());
    }
  }, [getPartnerProjectShare, location.search, dispatch]);

  useEffect(() => {
    if (error) {
      window.location.href = "https://probablefutures.org/";
    }
  }, [error]);

  return { projectSharedData: projectShare?.projectSharedData };
};

export default useShareProjectApi;
