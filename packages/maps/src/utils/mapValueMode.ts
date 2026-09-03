import { types } from "@probable-futures/lib";

import { ComparisonMode } from "../consts/mapConsts";
import { getAbsoluteMap } from "../consts/absoluteMaps";
import { isEra5Map } from "../consts/era5Maps";
import { isChangeMap } from "./mapSelection";

/**
 * What a map's cells hold. Absolute values can be laid beside each other and have
 * a 0.5°C baseline; change values are differences from that baseline, so they have
 * neither.
 */
export type MapValueMode = "absolute" | "change";

/**
 * What a row renders on its own. ERA5 is reanalysis of what happened, so it is
 * absolute whatever its dataset is; every other row is read from the dataset.
 */
export const getMapValueMode = (map?: types.Map): MapValueMode => {
  if (!map || isEra5Map(map)) {
    return "absolute";
  }
  return isChangeMap(map) ? "change" : "absolute";
};

/**
 * Whether a row can be shown as absolute — either it already is, or an absolute
 * rendering of it has been published. This is what decides if it may sit beside
 * ERA5.
 */
export const canRenderAbsolute = (map?: types.Map): boolean =>
  getMapValueMode(map) === "absolute" || !!getAbsoluteMap(map?.dataset.id, map?.mapVersion);

/**
 * Two sides may only be compared when they can render the same kind of value.
 * A change version paired with ERA5 is promoted to its absolute rendering, so it
 * counts as compatible whenever one exists.
 */
export const areComparable = (a?: types.Map, b?: types.Map): boolean => {
  if (!a || !b) {
    return false;
  }
  const modeA = getMapValueMode(a);
  const modeB = getMapValueMode(b);
  if (modeA === modeB) {
    return true;
  }
  // One is natively absolute; the other has to be able to follow it.
  return modeA === "absolute" ? canRenderAbsolute(b) : canRenderAbsolute(a);
};

export type ChangeView = {
  /** What the map is actually rendering. */
  mode: MapValueMode;
  /** Whether each option can be picked in the current configuration. */
  canChange: boolean;
  canAbsolute: boolean;
  /** True when only one option is possible, so the control is fixed. */
  locked: boolean;
};

type ChangeViewInput = {
  comparisonMode: ComparisonMode;
  selectedDataset?: types.Map;
  versionBefore?: types.Map;
  versionAfter?: types.Map;
  showEra5: boolean;
  showAbsolute: boolean;
};

/**
 * Which renderings the current configuration allows, and which one is showing.
 *
 * An option is offered only when everything on screen can honour it, so the two
 * halves of a comparison are never one absolute and one change.
 */
export const resolveChangeView = ({
  comparisonMode,
  selectedDataset,
  versionBefore,
  versionAfter,
  showEra5,
  showAbsolute,
}: ChangeViewInput): ChangeView => {
  let canChange: boolean;
  let canAbsolute: boolean;

  if (comparisonMode === "diff") {
    // A difference map was computed from the change rendering of each version, not
    // from their absolute ones, so the pairing behind it is fixed.
    const mode = getMapValueMode(selectedDataset);
    canChange = mode === "change";
    canAbsolute = mode === "absolute";
  } else if (comparisonMode === "swipe") {
    const sides = [versionBefore, versionAfter].filter(Boolean) as types.Map[];
    if (sides.length < 2 || sides.some(isEra5Map)) {
      // ERA5 has no change rendering, so the whole comparison follows it.
      canChange = false;
      canAbsolute = true;
    } else {
      canChange = sides.every((side) => getMapValueMode(side) === "change");
      canAbsolute = sides.every(canRenderAbsolute);
    }
  } else if (showEra5) {
    canChange = false;
    canAbsolute = true;
  } else {
    const mode = getMapValueMode(selectedDataset);
    canChange = mode === "change";
    canAbsolute =
      mode === "absolute" ||
      !!getAbsoluteMap(selectedDataset?.dataset.id, selectedDataset?.mapVersion);
  }

  const mode: MapValueMode =
    showAbsolute && canAbsolute ? "absolute" : canChange ? "change" : "absolute";

  return { mode, canChange, canAbsolute, locked: !(canChange && canAbsolute) };
};
