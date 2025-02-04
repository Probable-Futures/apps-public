import { INITIAL_ZOOM } from "./mapConsts";

export * from "./mapConsts";
export * from "./styles";
export * from "./export-simple-map-html";
export * from "./export-compare-map-html";
export * from "./climateZones";
export * from "./datasets";
export * from "./dataDescriptionAtPlace";

export const colors = {
  cream: "#f0f1e8",
  lightCream: "#f8f9f3",
  darkPurple: "#2a172d",
  white: "#fdfdfd",
  purple: "#851fff",
  grey: "#b6b4b7",
  lightGrey: "#cccccc",
  whiteSmoke: "#f5f5f5",
  blue: "#006CC9",
  silver: "#c0c0c0",
  textBlack: "#1b1a1c",
  red: "#da1720",
  black: "#000000",
  whiteOriginal: "#ffffff",
  dimBlack: "#1c101e",
  darkPurpleBackground: "#302530",
  secondaryGray: "#adadad",
  secondaryWhite: "#fefffc",
  primaryGray: "#a2a2a2",
  lightGrey2: "#787279",
};

export const size = {
  mobile: "375px",
  mobileMax: "767px",
  tablet: "768px",
  tabletMax: "1199px",
  laptop: "1200px",
  desktop: "1441px",
};

export const customTabletSizeForHeader = "800px";

export const getInitialMapViewState = (hash: string) => {
  if (!hash) {
    return null;
  }
  const [zoom, latitude, longitude] = hash.split("/");
  return {
    zoom: Number.isNaN(zoom) ? INITIAL_ZOOM : Number(zoom),
    longitude: Number.isNaN(longitude) ? 0 : Number(longitude),
    latitude: Number.isNaN(latitude) ? 0 : Number(latitude),
  };
};
