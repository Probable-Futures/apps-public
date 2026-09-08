import { versionDiffMaps, VersionDiffMap } from "./versionDiffMaps";
import { era5V3DiffMaps } from "./era5DiffMaps";

/**
 * The difference modes offered by the comparison control, beyond the plain
 * "none"/"swipe" pair. Adding the v4 − ERA5 mode that is coming later is one
 * registry (mirroring `era5DiffMaps`) plus one entry below — nothing else in
 * this file, or in the components that read it, needs to change.
 */
export type DiffComparisonMode = "diff" | "diffEra5V3";

export type DiffModeDescriptor = {
  mode: DiffComparisonMode;
  /** Stable value written to the `compare` URL param. */
  queryValue: string;
  registry: VersionDiffMap[];
  labelKey: string;
  labelFallback: string;
  pairLabel: string;
  /** True when one side is ERA5, which caps the warming scenario. */
  involvesEra5: boolean;
};

export const diffModeDescriptors: DiffModeDescriptor[] = [
  {
    mode: "diff",
    // Unchanged so links shared before this mode existed keep working.
    queryValue: "diff",
    registry: versionDiffMaps,
    labelKey: "menu.data.comparisonModes.diff",
    labelFallback: "Difference (v4 − v3)",
    pairLabel: "v4 − v3",
    involvesEra5: false,
  },
  {
    mode: "diffEra5V3",
    queryValue: "diff_era5_v3",
    registry: era5V3DiffMaps,
    labelKey: "menu.data.comparisonModes.diffEra5V3",
    labelFallback: "Difference (v3 − ERA5)",
    pairLabel: "v3 − ERA5",
    involvesEra5: true,
  },
];

export const isDiffMode = (mode: string): mode is DiffComparisonMode =>
  diffModeDescriptors.some((descriptor) => descriptor.mode === mode);

export const getDiffMode = (mode: string): DiffModeDescriptor | undefined =>
  diffModeDescriptors.find((descriptor) => descriptor.mode === mode);

export const getDiffModeForQueryValue = (value: string): DiffModeDescriptor | undefined =>
  diffModeDescriptors.find((descriptor) => descriptor.queryValue === value);

export const getDiffRegistry = (mode: string): VersionDiffMap[] =>
  getDiffMode(mode)?.registry ?? [];
