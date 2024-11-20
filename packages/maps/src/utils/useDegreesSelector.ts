import { useEffect } from "react";
import { consts } from "@probable-futures/lib";
import { useMediaQuery } from "react-responsive";

import { useMapData } from "../contexts/DataContext";
import { trackEvent } from "../utils/analytics";
import { setQueryParam } from "../utils";

const useDegreesSelector = () => {
  const {
    degrees,
    setDegrees,
    selectedDataset,
    showBaselineModal,
    setShowBaselineModal,
    showDegreeDescription,
    setShowDegreeDescription,
  } = useMapData();
  const isTablet = useMediaQuery({
    query: `(max-width: ${consts.size.tabletMax})`,
  });

  useEffect(() => {
    if (selectedDataset && !isTablet) {
      const warmingScenariosVisited: number[] = JSON.parse(
        localStorage.getItem(consts.LOCAL_STORAGE_WARMING_SCENARIOS_VISITED_KEY) || "[]",
      );
      if (warmingScenariosVisited.length === 0) {
        setShowDegreeDescription(true);
      }
    }
  }, [selectedDataset, degrees, isTablet, setShowDegreeDescription]);

  useEffect(() => {
    setShowBaselineModal((show: boolean) => (show ? false : show));
  }, [degrees, selectedDataset, setShowBaselineModal]);

  const updateVisitedWarmingScenarionsStorage = () => {
    if (selectedDataset) {
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
    const eventProps = {
      props: {
        map: `${selectedDataset?.name}`,
        warming_scenario: value,
      },
    };
    updateVisitedWarmingScenarionsStorage();
    if (showBaselineModal) {
      setShowBaselineModal(false);
    } else if (degrees === value && hasDescription) {
      if (!showDegreeDescription) {
        trackEvent("Warming info viewed", eventProps);
      }
      setShowDegreeDescription(!showDegreeDescription);
    } else {
      setDegrees(value);
      setQueryParam({ warmingScenario: value });
      trackEvent("Warming tab clicked", eventProps);
    }
  };

  return {
    onButtonClick,
    onCancel,
  };
};

export default useDegreesSelector;
