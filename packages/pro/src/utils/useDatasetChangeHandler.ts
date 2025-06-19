import { useCallback } from "react";
import { types } from "@probable-futures/lib";
import { useMapData } from "../contexts/DataContext";
import { useAppSelector } from "../app/hooks";
import useProjectUpdate from "./useProjectUpdate";

export const useDatasetChangeHandler = () => {
  const { climateData, selectedClimateData, setSelectedClimateData } = useMapData();
  const slugId = useAppSelector((state) => state.project.slugId);
  const { updateProject } = useProjectUpdate();

  return useCallback(
    async ({ value }: types.Option) => {
      if (!selectedClimateData || !value) {
        return;
      }
      if (value !== selectedClimateData.slug) {
        const map = climateData.find((m) => m.slug === value);
        if (map) {
          if (!slugId) {
            await updateProject({ pfDatasetId: map.dataset.id, erasePfMapConfig: true });
          }
          setSelectedClimateData(map);
        }
      }
    },
    [climateData, selectedClimateData, setSelectedClimateData, slugId, updateProject],
  );
};
