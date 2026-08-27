import { useMemo } from "react";
import { types } from "@probable-futures/lib";

import { useMenu } from "../components/Menu";
import { getDiffMapForPair, VersionDiffMap } from "../consts/versionDiffMaps";
import { Era5Map } from "../consts/era5Maps";

export const getActiveMapStyleId = (
  selectedDataset?: types.Map,
  activeDiffMap?: VersionDiffMap,
  activeEra5Map?: Era5Map,
): string | undefined =>
  activeDiffMap?.mapStyleId ?? activeEra5Map?.mapStyleId ?? selectedDataset?.mapStyleId;

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
