import { useMemo } from "react";
import { types } from "@probable-futures/lib";

import { useMenu } from "../components/Menu";
import { getDiffMapForPair, VersionDiffMap } from "../consts/versionDiffMaps";
import { Era5Map } from "../consts/era5Maps";
import { AbsoluteMap } from "../consts/absoluteMaps";
import { getDiffRegistry, isDiffMode } from "../consts/diffModes";

export const getActiveMapStyleId = (
  selectedDataset?: types.Map,
  activeDiffMap?: VersionDiffMap,
  activeEra5Map?: Era5Map,
  activeAbsoluteMap?: AbsoluteMap,
): string | undefined =>
  activeDiffMap?.mapStyleId ??
  activeEra5Map?.mapStyleId ??
  activeAbsoluteMap?.mapStyleId ??
  selectedDataset?.mapStyleId;

export default function useActiveDiffMap(): VersionDiffMap | undefined {
  const {
    data: { selectedDataset, comparisonMode, versionBefore, versionAfter },
  } = useMenu();

  return useMemo(
    () =>
      isDiffMode(comparisonMode)
        ? getDiffMapForPair(
            selectedDataset?.dataset.id,
            versionBefore?.mapVersion,
            versionAfter?.mapVersion,
            getDiffRegistry(comparisonMode),
          )
        : undefined,
    [comparisonMode, selectedDataset, versionBefore, versionAfter],
  );
}
