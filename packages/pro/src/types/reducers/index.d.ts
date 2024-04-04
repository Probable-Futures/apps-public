// Core Reducer
export {
  default as keplerGlReducerCore,
  visStateLens,
  mapStateLens,
  uiStateLens,
  mapStyleLens,
} from "./core";

// Each individual reducer
// export {default as visStateReducer} from './vis-state';
// export {default as mapStateReducer} from './map-state';
// export {default as mapStyleReducer} from './map-style';

// reducer updaters
export * as visStateUpdaters from "./vis-state-updaters";
export * as mapStateUpdaters from "./map-state-updaters";
export * as mapStyleUpdaters from "./map-style-updaters";
export * as uiStateUpdaters from "./ui-state-updaters";

// This will be deprecated
export * as combineUpdaters from "./combined-updaters";
export * as combinedUpdaters from "./combined-updaters";

// reducer merges
export * as visStateMergers from "./vis-state-merger";

// export types
export {
  AnimationConfig,
  Brush,
  Coordinate,
  Dataset,
  Datasets,
  Editor,
  Feature,
  FeatureValue,
  Field,
  FieldDomain,
  FieldPair,
  Filter,
  FilterBase,
  FilterRecord,
  Geocoder,
  GpuFilter,
  HistogramBin,
  InteractionConfig,
  LineChart,
  MapInfo,
  MultiSelectFieldDomain,
  MultiSelectFilter,
  PolygonFilter,
  RangeFieldDomain,
  RangeFilter,
  SelectFieldDomain,
  SelectFilter,
  SplitMap,
  TimeRangeFieldDomain,
  TimeRangeFilter,
  TooltipInfo,
  VisState,
} from "./vis-state-updaters";

export {
  BaseMapStyle,
  InputStyle,
  LayerGroup,
  MapboxStyleUrl,
  MapStyle,
  MapStyles,
  VisibleLayerGroups,
} from "./map-style-updaters";

export { Bounds, MapState, Viewport } from "./map-state-updaters";

export {
  ExportData,
  ExportHtml,
  ExportImage,
  ExportJson,
  ExportMap,
  LoadFiles,
  Locale,
  MapControl,
  MapControls,
  Notifications,
  UiState,
} from "./ui-state-updaters";

export * from "./types";
