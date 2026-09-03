import { useMemo } from "react";

import { useMenu } from "../components/Menu";
import { AbsoluteMap, getAbsoluteMap } from "../consts/absoluteMaps";

/**
 * The absolute style for the main map, or undefined when it should show the
 * dataset's own. Scoped to `comparisonMode === "none"`: with a comparison open
 * each side resolves its own style, and the ERA5 pairing does so automatically.
 * ERA5 wins outright — it is already absolute.
 */
export default function useActiveAbsoluteMap(): AbsoluteMap | undefined {
  const {
    data: { selectedDataset, comparisonMode, showEra5, showAbsolute },
  } = useMenu();

  return useMemo(
    () =>
      showAbsolute && !showEra5 && comparisonMode === "none"
        ? getAbsoluteMap(selectedDataset?.dataset.id, selectedDataset?.mapVersion)
        : undefined,
    [comparisonMode, selectedDataset, showEra5, showAbsolute],
  );
}
