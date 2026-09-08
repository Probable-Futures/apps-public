import { useCallback, useMemo } from "react";
import { types } from "@probable-futures/lib";

import { ComparisonMode } from "../consts/mapConsts";
import {
  DiffComparisonMode,
  diffModeDescriptors,
  getDiffMode,
  isDiffMode,
} from "../consts/diffModes";
import { buildEra5Map, Era5Map, getEra5MapForDataset } from "../consts/era5Maps";
import { Segment } from "../components/common/SegmentedControl";
import { useTranslation } from "../contexts/TranslationContext";
import { DiffPair, getAvailableDiffPairs, getDefaultDiffPair } from "./mapVersions";

type UseComparisonModesArgs = {
  selectedDataset?: types.Map;
  versionsOfSelectedDataset: types.Map[];
  comparisonMode: ComparisonMode;
  versionBefore?: types.Map;
  versionAfter?: types.Map;
  setComparisonMode: (mode: ComparisonMode) => void;
  setVersionBefore: (map?: types.Map) => void;
  setVersionAfter: (map?: types.Map) => void;
};

type UseComparisonModesResult = {
  /**
   * Memoized so an ERA5 comparison side is the same object across renders — the
   * reconcile effect in `Data.tsx` settles by identity, and a fresh object each
   * pass would make it loop forever.
   */
  era5Map: types.Map | undefined;
  era5Entry: Era5Map | undefined;
  hasEra5: boolean;
  diffPairsByMode: Record<DiffComparisonMode, DiffPair[]>;
  segments: Segment<ComparisonMode>[];
  onComparisonModeChange: (mode: ComparisonMode) => void;
};

/**
 * The comparison segment list and its mode-change handler, driving the control in
 * `Data.tsx`. A future difference mode is a registry plus one entry in
 * `diffModeDescriptors` — nothing here needs to change to pick it up.
 */
export default function useComparisonModes({
  selectedDataset,
  versionsOfSelectedDataset,
  comparisonMode,
  versionBefore,
  versionAfter,
  setComparisonMode,
  setVersionBefore,
  setVersionAfter,
}: UseComparisonModesArgs): UseComparisonModesResult {
  const { translate } = useTranslation();

  const era5Entry = useMemo(
    () => getEra5MapForDataset(selectedDataset?.dataset.id),
    [selectedDataset],
  );

  const hasEra5 = !!era5Entry;

  const era5Map = useMemo(
    () => (selectedDataset && era5Entry ? buildEra5Map(selectedDataset, era5Entry) : undefined),
    [selectedDataset, era5Entry],
  );

  const diffPairsByMode = useMemo(() => {
    const byMode = {} as Record<DiffComparisonMode, DiffPair[]>;
    diffModeDescriptors.forEach((descriptor) => {
      byMode[descriptor.mode] = getAvailableDiffPairs(
        versionsOfSelectedDataset,
        selectedDataset?.dataset.id,
        descriptor.registry,
        descriptor.involvesEra5 ? era5Map : undefined,
      );
    });
    return byMode;
  }, [versionsOfSelectedDataset, selectedDataset, era5Map]);

  const segments: Segment<ComparisonMode>[] = useMemo(
    () => [
      { value: "none", label: translate("menu.data.comparisonModes.none", "Off") },
      { value: "swipe", label: translate("menu.data.comparisonModes.swipe", "Side by side") },
      ...diffModeDescriptors.map((descriptor) => {
        const pairs = diffPairsByMode[descriptor.mode];
        return {
          value: descriptor.mode,
          label: translate(descriptor.labelKey, descriptor.labelFallback),
          disabled: pairs.length === 0,
          hint:
            pairs.length === 0
              ? translate(
                  "menu.data.noDiffMapHint",
                  "No difference map has been published for this dataset.",
                )
              : undefined,
        };
      }),
    ],
    [translate, diffPairsByMode],
  );

  const onComparisonModeChange = useCallback(
    (mode: ComparisonMode) => {
      if (mode === "none") {
        setVersionBefore(undefined);
        setVersionAfter(undefined);
      } else if (isDiffMode(mode)) {
        const descriptor = getDiffMode(mode);
        const pair = getDefaultDiffPair(
          versionsOfSelectedDataset,
          selectedDataset?.dataset.id,
          versionBefore,
          versionAfter,
          descriptor?.registry,
          descriptor?.involvesEra5 ? era5Map : undefined,
        );
        if (!pair) {
          return;
        }
        setVersionBefore(pair.before);
        setVersionAfter(pair.after);
      }
      setComparisonMode(mode);
    },
    [
      versionsOfSelectedDataset,
      selectedDataset,
      versionBefore,
      versionAfter,
      era5Map,
      setComparisonMode,
      setVersionBefore,
      setVersionAfter,
    ],
  );

  return { era5Map, era5Entry, hasEra5, diffPairsByMode, segments, onComparisonModeChange };
}
