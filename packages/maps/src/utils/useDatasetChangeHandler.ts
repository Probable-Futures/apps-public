import { useCallback } from "react";
import { types } from "@probable-futures/lib";
import { useMapData, defaultDegreesForChangeMaps } from "../contexts/DataContext";
import { setQueryParam } from "../utils";
import { trackEvent } from "../utils/analytics";
import { trackMixpanelEvent, AnalyticsEvent } from "../utils/mixpanelAnalytics";

export const useDatasetChangeHandler = (source?: string) => {
  const {
    datasets,
    degrees,
    comparisonScenarioBefore,
    isComparisonMapActive,
    comparisonScenarioAfter,
    setDegrees,
    setSelectedDataset,
    setComparisonScenarioBefore,
    setComparisonScenarioAfter,
  } = useMapData();

  return useCallback(
    ({ value }: types.Option) => {
      const dataset = datasets.find(({ slug, isLatest }) => slug === value && isLatest);
      if (dataset) {
        setSelectedDataset(dataset);

        // Handle the case where the user switches to a change map while having a 0.5 warming scenario selected
        let warmingScenario;
        let nextComparisonBefore = comparisonScenarioBefore;
        let nextComparisonAfter = comparisonScenarioAfter;
        if (dataset.isDiff || dataset?.name.toLowerCase().startsWith("change")) {
          if (degrees === 0.5) {
            setDegrees(defaultDegreesForChangeMaps);
            warmingScenario = defaultDegreesForChangeMaps;
          }
          if (isComparisonMapActive && comparisonScenarioBefore === 0.5) {
            nextComparisonBefore = defaultDegreesForChangeMaps;
            setComparisonScenarioBefore(nextComparisonBefore);
            if (comparisonScenarioAfter === 1) {
              nextComparisonAfter = 1.5;
              setComparisonScenarioAfter(nextComparisonAfter);
            }
          }
        }

        setQueryParam({
          mapSlug: dataset.slug,
          warmingScenario,
          version: "latest",
          ...(isComparisonMapActive
            ? {
                isComparisonMapActive: true,
                comparisonScenarioBefore: nextComparisonBefore,
                comparisonScenarioAfter: nextComparisonAfter,
              }
            : {}),
        });

        trackEvent("Map viewed", { props: { map: dataset.name } });
        trackMixpanelEvent(AnalyticsEvent.MAP_CHANGED, {
          map_name: dataset.name,
          map_slug: dataset.slug,
          source: source || "map_selector",
        });
      }
    },
    [
      datasets,
      setSelectedDataset,
      source,
      degrees,
      isComparisonMapActive,
      comparisonScenarioBefore,
      setDegrees,
      setComparisonScenarioBefore,
      comparisonScenarioAfter,
      setComparisonScenarioAfter,
    ],
  );
};
