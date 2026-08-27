import { useMemo } from "react";

import { useMenu } from "../components/Menu";
import { Era5Map, getEra5MapForDataset } from "../consts/era5Maps";

/**
 * The ERA5 style for the main map, or undefined when the map should show the
 * dataset's own. Scoped to `comparisonMode === "none"`: with a comparison open
 * each side carries its own style, so an ERA5 main map would fight it.
 */
export default function useActiveEra5Map(): Era5Map | undefined {
  const {
    data: { selectedDataset, comparisonMode, showEra5 },
  } = useMenu();

  return useMemo(
    () =>
      showEra5 && comparisonMode === "none"
        ? getEra5MapForDataset(selectedDataset?.dataset.id)
        : undefined,
    [comparisonMode, selectedDataset, showEra5],
  );
}
