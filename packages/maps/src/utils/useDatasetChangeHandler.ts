import { useCallback } from "react";
import { types } from "@probable-futures/lib";
import { useMapData, defaultDegreesForChangeMaps } from "../contexts/DataContext";
import { setQueryParam } from "../utils";
import { trackEvent } from "../utils/analytics";

export const useDatasetChangeHandler = () => {
  const { datasets, degrees, setDegrees, setSelectedDataset } = useMapData();

  return useCallback(
    ({ value }: types.Option) => {
      const dataset = datasets.find(({ slug, isLatest }) => slug === value && isLatest);
      if (dataset) {
        setSelectedDataset(dataset);

        let warmingScenario;
        if (
          degrees === 0.5 &&
          (dataset.isDiff || dataset?.name.toLowerCase().startsWith("change"))
        ) {
          setDegrees(defaultDegreesForChangeMaps);
          warmingScenario = defaultDegreesForChangeMaps;
        }

        setQueryParam({
          mapSlug: dataset.slug,
          warmingScenario,
          version: "latest",
        });

        trackEvent("Map viewed", { props: { map: dataset.name } });
      }
    },
    [datasets, degrees, setDegrees, setSelectedDataset],
  );
};
