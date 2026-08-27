import { useMemo } from "react";
import { types } from "@probable-futures/lib";

import { useMenu } from "../components/Menu";
import { getDiffMapForPair, VersionDiffMap } from "../consts/versionDiffMaps";

export const getActiveMapStyleId = (
  selectedDataset?: types.Map,
  activeDiffMap?: VersionDiffMap,
): string | undefined => activeDiffMap?.mapStyleId ?? selectedDataset?.mapStyleId;

export default function useActiveDiffMap(): VersionDiffMap | undefined {
  const {
    data: { selectedDataset, comparisonMode, versionBefore, versionAfter },
  } = useMenu();

  return useMemo(
    () =>
      comparisonMode === "diff"
        ? getDiffMapForPair(
            selectedDataset?.dataset.id,
            versionBefore?.mapVersion,
            versionAfter?.mapVersion,
          )
        : undefined,
    [comparisonMode, selectedDataset, versionBefore, versionAfter],
  );
}
