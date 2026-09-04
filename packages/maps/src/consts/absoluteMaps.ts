/**
 * Absolute renderings of the change maps, one entry per dataset *per version*.
 *
 * A change map shows a difference from the baseline, which cannot be laid beside
 * ERA5 — ERA5 is absolute. These styles show the same version's underlying
 * absolute values so the two are comparable.
 *
 * The ramp is carried here too, the way the difference maps carry theirs: a change
 * map's own bins straddle zero, so an absolute rendering painted with them would
 * put every cell in the top bin. One ramp per dataset — v3 and v4 measure the same
 * variable in the same units, so a comparison between them stays on one scale.
 */
export type AbsoluteMap = {
  datasetId: number;
  mapVersion: number;
  mapStyleId: string;
};

const absoluteMap = (datasetId: number, mapVersion: number, mapStyleId: string): AbsoluteMap => ({
  datasetId,
  mapVersion,
  mapStyleId,
});

export const absoluteMaps: AbsoluteMap[] = [
  absoluteMap(40601, 3, "cmtinyy5n00br01qtexnz1blu"),
  absoluteMap(40601, 4, "cmtiovs2g00bt01qtcqzkdgt6"),
  absoluteMap(40607, 3, "cmtloon3o00ox01qt2a3mfk23"),
  absoluteMap(40613, 3, "cmtlokbhg00ow01qtar2q12uv"),
  absoluteMap(40613, 4, "cmtlofym800ov01qt2xer9gpm"),
  absoluteMap(40614, 3, "cmtio50gy008x01s5fwswcxg8"),
  absoluteMap(40614, 4, "cmtip54yu00au01qu0u4k7c0c"),
  absoluteMap(40616, 3, "cmtio9u2c00b501sgc1bx6sn7"),
  absoluteMap(40616, 4, "cmtiphoos00b701sg201h20v8"),
  absoluteMap(40703, 3, "cmtlp1x1f00nq01saci2xagz6"),
  absoluteMap(40703, 4, "cmtloxymw009b01qybzv30jlf"),
  absoluteMap(40704, 3, "cmtlp5s3i009z01r2gi588fws"),
];

export type AbsoluteRamp = {
  /** Bin edges for the absolute values, ascending. */
  stops: number[];
  /** Optional: the dataset's own colours are kept when this is left out. */
  binHexColors?: string[];
  unitLabel: string;
};

const PRECIPITATION_SUM_RAMP: AbsoluteRamp = {
  stops: [100, 250, 500, 1000, 1500, 2000],
  binHexColors: ["#a36440", "#d98600", "#ffab24", "#515866", "#25a8b7", "#007ea7", "#003459"],
  unitLabel: "mm",
};

/**
 * Absolute bins per dataset id, shared by that dataset's absolute styles and by
 * ERA5. A dataset with no entry falls back to its change bins, which paints the
 * absolute rendering flat — so every change dataset reachable as absolute wants
 * one, including those with no absolute style of their own but with ERA5.
 *
 * Still to come:
 *   40607 dry hot days                       — days
 *   40613 "1-in-100-year" storm              — mm, but a single-day total, so a
 *                                              much smaller range than the sums
 *   40614 snowy days                         — days
 *   40703 mean SPEI-12                       — z-score
 *   40704 wildfire danger days               — days
 */
export const absoluteRamps: Record<number, AbsoluteRamp> = {
  40601: PRECIPITATION_SUM_RAMP,
  40616: PRECIPITATION_SUM_RAMP,
};

export const getAbsoluteRamp = (
  datasetId?: number,
  ramps: Record<number, AbsoluteRamp> = absoluteRamps,
): AbsoluteRamp | undefined => (datasetId === undefined ? undefined : ramps[datasetId]);

export const getAbsoluteMap = (
  datasetId?: number,
  mapVersion?: number,
  registry: AbsoluteMap[] = absoluteMaps,
): AbsoluteMap | undefined =>
  datasetId === undefined || mapVersion === undefined
    ? undefined
    : registry.find(
        (entry) =>
          entry.datasetId === datasetId && entry.mapVersion === mapVersion && !!entry.mapStyleId,
      );
