import { types } from "@probable-futures/lib";

type MapProps = {
  datasetId?: number;
  dataset?: types.Map;
  tempUnit?: "°C" | "°F";
  viewState: Partial<{ longitude: number; latitude: number; zoom: number }>;
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  precipitationUnit?: types.PrecipitationUnit;
  showBorders?: boolean;
  showPopupOnFirstLoad?: boolean;
  overrideUIStyles?: { selector: string; styles: any }[];
  hideTitle?: boolean;
  hideControls?: boolean;
  hideMapLegend?: boolean;
  hideResetMapButton?: boolean;
  mapboxAccessToken: string;
  usePfFonts?: boolean;
  // mapbox://styles/{username}/{mapStyleId}
  mapStyleUrl: string;
};

export type SimpleMapProps = MapProps & { scenario?: number };

export type CompareMapProps = MapProps & {
  compare: {
    scenarioBefore: number;
    scenarioAfter: number;
  };
};
