import { FunctionComponent, ComponentProps } from "react";

import { ReactComponent as TempMoreIcon } from "../assets/icons/temp-more.svg";
import { ReactComponent as TempLessIcon } from "../assets/icons/temp-less.svg";
import { ReactComponent as TempNeutralIcon } from "../assets/icons/temp-neutral.svg";
import { ReactComponent as WaterMoreIcon } from "../assets/icons/water-more.svg";
import { ReactComponent as WaterLessIcon } from "../assets/icons/water-less.svg";
import { ReactComponent as WaterNeutralIcon } from "../assets/icons/water-neutral.svg";
import { ReactComponent as SnowMoreIcon } from "../assets/icons/snow-more.svg";
import { ReactComponent as SnowLessIcon } from "../assets/icons/snow-less.svg";
import { ReactComponent as SnowNeutralIcon } from "../assets/icons/snow-neutral.svg";

type IconComponent = FunctionComponent<ComponentProps<"svg"> & { title?: string }>;

export type YearIcons = {
  // ordered by percentile: low = dataLabels[0], mid = [1], high = [2]
  low: IconComponent;
  mid: IconComponent;
  high: IconComponent;
};

type Theme = "temp" | "water" | "snow";
type Polarity = "more" | "less" | "neutral";

const getTheme = (dataLabels?: string[]): Theme => {
  const all = (dataLabels || []).join(" ").toLowerCase();
  if (all.includes("warm") || all.includes("cool")) return "temp";
  if (all.includes("snow")) return "snow";
  if (all.includes("wet") || all.includes("dry") || all.includes("drie")) return "water";
  return "temp";
};

// Classify a single dataLabel by what it describes, so reversed datasets
// (where the high percentile is the drier/cooler one) still get the right icon.
const getPolarity = (label?: string): Polarity => {
  const l = (label || "").toLowerCase();
  if (l.includes("warm")) return "more";
  if (l.includes("cool")) return "less";
  if (l.includes("snow")) return l.includes("less") ? "less" : "more";
  if (l.includes("wet")) return "more";
  if (l.includes("dry") || l.includes("drie")) return "less";
  return "neutral";
};

const iconForSlot = (theme: Theme, dataLabels: string[] | undefined, index: 0 | 1 | 2) => {
  const polarity = getPolarity(dataLabels?.[index]);
  if (theme === "temp") {
    return polarity === "more"
      ? TempMoreIcon
      : polarity === "less"
      ? TempLessIcon
      : TempNeutralIcon;
  }
  if (theme === "water") {
    return polarity === "more"
      ? WaterMoreIcon
      : polarity === "less"
      ? WaterLessIcon
      : WaterNeutralIcon;
  }
  return polarity === "more" ? SnowMoreIcon : polarity === "less" ? SnowLessIcon : SnowNeutralIcon;
};

/**
 * Picks the year-toggle icons for a dataset based on its own dataLabels, so they
 * stay accurate for wetter/drier, snowier, percentile, etc. maps instead of always
 * showing thermometers. Falls back to thermometers when no labels are available.
 */
export const getYearIcons = (dataLabels?: string[]): YearIcons => {
  if (!dataLabels || dataLabels.length === 0) {
    return { low: TempLessIcon, mid: TempNeutralIcon, high: TempMoreIcon };
  }
  const theme = getTheme(dataLabels);
  return {
    low: iconForSlot(theme, dataLabels, 0),
    mid: iconForSlot(theme, dataLabels, 1),
    high: iconForSlot(theme, dataLabels, 2),
  };
};
