import { useEffect } from "react";

import { useMapData } from "../contexts/DataContext";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { SET_MAP_CONFIG } from "../store/actions";
import useProjectUpdate from "./useProjectUpdate";

export type ButtonContainerProps = {
  isActive: boolean;
};

const useDegreesSelector = () => {
  const { selectedClimateData, showBaselineModal, setShowBaselineModal } = useMapData();
  const degrees = useAppSelector((state) => state.project.mapConfig?.pfMapConfig?.warmingScenario);
  const slugId = useAppSelector((state) => state.project.slugId);
  const dispatch = useAppDispatch();
  const mapConfig = useAppSelector((state) => state.project.mapConfig);
  const { updateProject } = useProjectUpdate();

  useEffect(() => {
    setShowBaselineModal((show: boolean) => (show ? false : show));
  }, [degrees, selectedClimateData, setShowBaselineModal]);

  const onButtonClick = (value: number) => {
    if (showBaselineModal) {
      setShowBaselineModal(false);
    } else if (
      value === 0.5 &&
      (selectedClimateData?.isDiff || selectedClimateData?.name.toLowerCase().startsWith("change"))
    ) {
      setShowBaselineModal(true);
    } else {
      if (slugId) {
        dispatch({
          type: SET_MAP_CONFIG,
          payload: {
            mapConfig: {
              ...mapConfig,
              pfMapConfig: { ...mapConfig.pfMapConfig, warmingScenario: value },
            },
          },
        });
      } else {
        updateProject({ mapStyleConfig: { key: "warmingScenario", value } });
      }
    }
  };

  return {
    onButtonClick,
  };
};

export default useDegreesSelector;
