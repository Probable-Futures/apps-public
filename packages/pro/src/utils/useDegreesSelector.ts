import { useEffect } from "react";
import { consts } from "@probable-futures/lib";
import { useMediaQuery } from "react-responsive";

import { useMapData } from "../contexts/DataContext";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { SET_MAP_CONFIG } from "../store/actions";
import useProjectUpdate from "./useProjectUpdate";

export type ButtonContainerProps = {
  showDegreeDescription: boolean;
  isActive: boolean;
};

const useDegreesSelector = () => {
  const {
    selectedClimateData,
    showBaselineModal,
    setShowBaselineModal,
    showDegreeDescription,
    setShowDegreeDescription,
  } = useMapData();
  const degrees = useAppSelector((state) => state.project.mapConfig?.pfMapConfig?.warmingScenario);
  const slugId = useAppSelector((state) => state.project.slugId);
  const dispatch = useAppDispatch();
  const mapConfig = useAppSelector((state) => state.project.mapConfig);
  const { updateProject } = useProjectUpdate();
  const isTablet = useMediaQuery({
    query: `(max-width: ${consts.size.tabletMax})`,
  });

  useEffect(() => {
    if (selectedClimateData && !isTablet) {
      const warmingScenariosVisited: number[] = JSON.parse(
        localStorage.getItem(consts.LOCAL_STORAGE_WARMING_SCENARIOS_VISITED_KEY) || "[]",
      );
      if (warmingScenariosVisited.length === 0) {
        setShowDegreeDescription(true);
      }
    }
  }, [selectedClimateData, degrees, isTablet, setShowDegreeDescription]);

  useEffect(() => {
    setShowBaselineModal((show: boolean) => (show ? false : show));
  }, [degrees, selectedClimateData, setShowBaselineModal]);

  const updateVisitedWarmingScenarionsStorage = () => {
    if (selectedClimateData) {
      const warmingScenariosVisited: number[] = JSON.parse(
        localStorage.getItem(consts.LOCAL_STORAGE_WARMING_SCENARIOS_VISITED_KEY) || "[]",
      );
      if (warmingScenariosVisited.length === 0) {
        warmingScenariosVisited.push(degrees);
        localStorage.setItem(
          consts.LOCAL_STORAGE_WARMING_SCENARIOS_VISITED_KEY,
          JSON.stringify(warmingScenariosVisited),
        );
      }
    }
  };

  const onCancel = () => {
    updateVisitedWarmingScenarionsStorage();
    setShowDegreeDescription(false);
  };

  const onButtonClick = (value: number, hasDescription: boolean) => {
    updateVisitedWarmingScenarionsStorage();
    if (showBaselineModal) {
      setShowBaselineModal(false);
    } else if (degrees === value && hasDescription) {
      setShowDegreeDescription(!showDegreeDescription);
    } else {
      if (
        value === 0.5 &&
        (selectedClimateData?.isDiff ||
          selectedClimateData?.name.toLowerCase().startsWith("change"))
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
    }
  };

  return {
    onButtonClick,
    onCancel,
  };
};

export default useDegreesSelector;
