import { useMutation } from "@apollo/client";
import { useCallback, useEffect } from "react";

import { MapConfig, Project, UpdateProjectParams } from "./projectHelper";
import { UPDATE_PARTNER_PROJECT } from "../graphql/queries/projects";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { SET_IMAGE_URL, SET_MAP_CONFIG, SET_PF_DATASET_ID } from "../store/actions";
import { initialState } from "../store/reducers/projectReducer";

const useProjectUpdate = () => {
  const [updatePartnerProject, { data }] = useMutation(UPDATE_PARTNER_PROJECT);
  const updatedProject = data?.updatePartnerProject?.pfPartnerProject as Project | undefined;
  const dispatch = useAppDispatch();
  const currentProjectId = useAppSelector((state) => state.project.projectId);
  const currentMapConfig = useAppSelector((state) => state.project.mapConfig);
  const currentPfDatasetId = useAppSelector((state) => state.project.pfDatasetId);
  const currentImageUrl = useAppSelector((state) => state.project.imageUrl);

  useEffect(() => {
    if (updatedProject) {
      dispatch({
        type: SET_IMAGE_URL,
        payload: { imageUrl: updatedProject.imageUrl },
      });
      dispatch({
        type: SET_MAP_CONFIG,
        payload: { mapConfig: updatedProject.mapConfig },
      });
      dispatch({
        type: SET_PF_DATASET_ID,
        payload: {
          pfDatasetId: updatedProject.pfDatasetId,
        },
      });
    }
  }, [updatedProject, dispatch]);

  const updateProject = useCallback(
    ({
      imageUrl,
      pfDatasetId,
      mapStyleConfig,
      erasePfMapConfig,
      eraseKeplerConfig,
      keplerConfig,
    }: UpdateProjectParams) => {
      if (!currentProjectId) {
        return;
      }
      const payload: {
        projectId: string;
        imageUrl?: string;
        pfDatasetId?: number;
        mapConfig?: MapConfig;
      } = {
        projectId: currentProjectId,
        imageUrl: imageUrl || currentImageUrl,
        pfDatasetId: pfDatasetId || currentPfDatasetId,
        mapConfig: currentMapConfig,
      };
      if (keplerConfig) {
        const updatedMapConfig = {
          ...currentMapConfig,
          keplerConfig,
        };
        payload.mapConfig = updatedMapConfig;
      }
      if (mapStyleConfig) {
        const updatedMapConfig = {
          ...currentMapConfig,
          pfMapConfig: {
            ...currentMapConfig?.pfMapConfig,
            [mapStyleConfig.key]: mapStyleConfig.value,
          },
        };
        payload.mapConfig = updatedMapConfig;
      }
      if (erasePfMapConfig) {
        const updatedMapConfig = {
          ...currentMapConfig,
          pfMapConfig: { ...initialState.mapConfig.pfMapConfig },
        };
        payload.mapConfig = updatedMapConfig;
      }
      if (eraseKeplerConfig) {
        const updatedMapConfig = {
          ...currentMapConfig,
          keplerConfig: undefined,
        };
        payload.mapConfig = updatedMapConfig;
      }
      return updatePartnerProject({
        variables: payload,
      });
    },
    [currentImageUrl, currentPfDatasetId, currentProjectId, currentMapConfig, updatePartnerProject],
  );

  return { updateProject };
};

export default useProjectUpdate;
