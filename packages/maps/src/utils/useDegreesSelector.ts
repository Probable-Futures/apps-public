import { useEffect, useState } from "react";

import { useMapData } from "../contexts/DataContext";
import { trackEvent } from "../utils/analytics";
import { trackMixpanelEvent, AnalyticsEvent } from "../utils/mixpanelAnalytics";
import { setQueryParam } from "../utils";

export type ComparisonPendingSide = "before" | "after" | null;

const useDegreesSelector = () => {
  const {
    degrees,
    setDegrees,
    selectedDataset,
    showBaselineModal,
    setShowBaselineModal,
    isComparisonMapActive,
    comparisonScenarioBefore,
    comparisonScenarioAfter,
    setComparisonScenarioBefore,
    setComparisonScenarioAfter,
  } = useMapData();

  const [pendingSide, setPendingSide] = useState<ComparisonPendingSide>(null);

  useEffect(() => {
    setShowBaselineModal((show: boolean) => (show ? false : show));
  }, [degrees, selectedDataset, setShowBaselineModal]);

  useEffect(() => {
    if (!isComparisonMapActive) {
      setPendingSide(null);
    }
  }, [isComparisonMapActive]);

  const isChangeMap = !!(
    selectedDataset?.isDiff || selectedDataset?.name.toLowerCase().startsWith("change")
  );

  const commitComparison = (newBefore: number, newAfter: number) => {
    setComparisonScenarioBefore(newBefore);
    setComparisonScenarioAfter(newAfter);
    setQueryParam({
      isComparisonMapActive: true,
      comparisonScenarioBefore: newBefore,
      comparisonScenarioAfter: newAfter,
    });
  };

  const applyComparisonClick = (value: number) => {
    if (pendingSide) {
      // Lock the still-active endpoint — clicking it while the other side is pending
      // must not deselect it (would leave nothing selected).
      const otherValue =
        pendingSide === "before" ? comparisonScenarioAfter : comparisonScenarioBefore;
      if (value === otherValue) {
        return;
      }
      let newBefore = comparisonScenarioBefore;
      let newAfter = comparisonScenarioAfter;
      if (pendingSide === "before") {
        newBefore = value;
      } else {
        newAfter = value;
      }
      if (newBefore > newAfter) {
        [newBefore, newAfter] = [newAfter, newBefore];
      }
      commitComparison(newBefore, newAfter);
      setPendingSide(null);
      return;
    }
    if (value === comparisonScenarioBefore) {
      setPendingSide("before");
      return;
    }
    if (value === comparisonScenarioAfter) {
      setPendingSide("after");
      return;
    }
    let newBefore = comparisonScenarioBefore;
    let newAfter = comparisonScenarioAfter;
    if (value < comparisonScenarioBefore) {
      newBefore = value;
    } else if (value > comparisonScenarioAfter) {
      newAfter = value;
    } else {
      // value is strictly between before and after
      const diffToAfter = comparisonScenarioAfter - value;
      const diffToBefore = value - comparisonScenarioBefore;
      if (diffToAfter > diffToBefore) {
        newBefore = value;
      } else if (diffToAfter < diffToBefore) {
        newAfter = value;
      } else {
        if (comparisonScenarioAfter === 3) {
          newBefore = value;
        } else if (comparisonScenarioBefore === 0.5 || comparisonScenarioBefore === 1) {
          newAfter = value;
        } else {
          newBefore = value;
        }
      }
    }
    commitComparison(newBefore, newAfter);
  };

  const onButtonClick = (value: number, hasDescription: boolean) => {
    const eventProps = {
      props: {
        map: `${selectedDataset?.name}`,
        warming_scenario: value,
      },
    };
    if (showBaselineModal) {
      setShowBaselineModal(false);
    } else if (value === 0.5 && isChangeMap) {
      setShowBaselineModal(true);
    } else if (isComparisonMapActive) {
      applyComparisonClick(value);
      trackMixpanelEvent(AnalyticsEvent.WARMING_SCENARIO_CHANGED, {
        map_name: selectedDataset?.name,
        warming_scenario: value,
      });
    } else {
      setDegrees(value);
      setQueryParam({ warmingScenario: value });
      trackMixpanelEvent(AnalyticsEvent.WARMING_SCENARIO_CHANGED, {
        map_name: selectedDataset?.name,
        warming_scenario: value,
      });
    }

    trackEvent("Warming tab clicked", eventProps);
  };

  return {
    onButtonClick,
    pendingSide,
  };
};

export default useDegreesSelector;
