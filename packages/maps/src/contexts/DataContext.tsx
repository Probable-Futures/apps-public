import { createContext, useState, useMemo, useContext, PropsWithChildren } from "react";
import { Projection } from "mapbox-gl";

import { types, AboutMapResources } from "@probable-futures/lib";
import { BinningType } from "@probable-futures/lib/src/utils/colors";

export type SupportedProjectionsType = Extract<Projection["name"], "mercator" | "globe">;
export const supportedProjections: SupportedProjectionsType[] = ["mercator", "globe"];
export const defaultDegreesForNonChangeMaps = 0.5;
export const defaultDegreesForChangeMaps = 1;

type State = {
  datasets: types.Map[];
  selectedDataset?: types.Map;
  degrees: number;
  expandedCategory?: string;
  expandedMaps?: string;
  warmingScenarioDescs: types.WarmingScenarioDescs;
  tempUnit: types.TempUnit;
  showBaselineModal: boolean;
  showDescriptionModal: boolean;
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  searchIsOpen: boolean;
  moreIsOpen: boolean;
  mapProjection: Projection;
  activeClimateZoneLayers?: string[];
  precipitationUnit: types.PrecipitationUnit;
  showCountryBorders: boolean;
  showAboutMap: boolean;
  showAllMapsModal: boolean;
  aboutMapResources?: AboutMapResources;
  percentileValue: BinningType;
  isComparisonMapActive: boolean;
  comparisonScenarioBefore: number;
  comparisonScenarioAfter: number;
  setIsComparisonMapActive(arg: boolean): void;
  setComparisonScenarioBefore(arg: number): void;
  setComparisonScenarioAfter(arg: number): void;
  setPercentileValue(arg: BinningType): void;
  setShowAllMapsModal: (arg: boolean) => void;
  setShowAboutMap: (arg: boolean) => void;
  setAboutMapResources: (arg: AboutMapResources) => void;
  setDatasets(arg: any): void;
  setSelectedDataset(arg: any): void;
  setDegrees(arg: any): void;
  setExpandedCategory(arg: any): void;
  setExpandedMaps(arg: any): void;
  setWarmingScenarioDescs(arg: any): void;
  setTempUnit(arg: types.TempUnit): void;
  setShowBaselineModal(arg: any): void;
  setShowDescriptionModal(arg: any): void;
  setWpDatasetDescriptionResponse(
    datasetDescriptionResponse: types.DatasetDescriptionResponse,
  ): void;
  setSearchIsOpen(arg: any): void;
  setMoreIsOpen(arg: any): void;
  setMapProjection(projection: Projection): void;
  setActiveClimateZoneLayers(arg?: string[]): void;
  setPrecipitationUnit(arg: types.PrecipitationUnit): void;
  setShowCountryBorders(arg: any): void;
};

const initialState = {
  datasets: [],
  selectedDataset: undefined,
  degrees: defaultDegreesForNonChangeMaps,
  expandedCategory: undefined,
  expandedMaps: undefined,
  warmingScenarioDescs: {},
  tempUnit: "°C" as types.TempUnit,
  showBaselineModal: false,
  showDescriptionModal: false,
  datasetDescriptionResponse: undefined,
  searchIsOpen: false,
  moreIsOpen: false,
  mapProjection: { name: "mercator" } as Projection,
  activeClimateZoneLayers: undefined,
  precipitationUnit: "mm" as types.PrecipitationUnit,
  showCountryBorders: true,
  showAboutMap: false,
  showAllMapsModal: false,
  aboutMapResources: undefined,
  percentileValue: "mid" as BinningType,
  isComparisonMapActive: false,
  comparisonScenarioBefore: defaultDegreesForNonChangeMaps,
  comparisonScenarioAfter: 1.5,
  setIsComparisonMapActive: () => {},
  setComparisonScenarioBefore: () => {},
  setComparisonScenarioAfter: () => {},
  setPercentileValue: () => {},
  setShowAllMapsModal: () => {},
  setShowAboutMap: () => {},
  setAboutMapResources: () => {},
  setDatasets: () => {},
  setSelectedDataset: () => {},
  setDegrees: () => {},
  setExpandedCategory: () => {},
  setExpandedMaps: () => {},
  setWarmingScenarioDescs: () => {},
  setTempUnit: () => {},
  setShowBaselineModal: () => {},
  setShowDescriptionModal: () => {},
  setWpDatasetDescriptionResponse: () => {},
  setSearchIsOpen: () => {},
  setMoreIsOpen: () => {},
  setMapProjection: () => {},
  setActiveClimateZoneLayers: () => {},
  setPrecipitationUnit: () => {},
  setShowCountryBorders: () => {},
};

const DataContext = createContext<State>(initialState);

export function DataProvider(props: PropsWithChildren<{}>): JSX.Element {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState();
  const [degrees, setDegrees] = useState(defaultDegreesForNonChangeMaps);
  const [expandedCategory, setExpandedCategory] = useState();
  const [expandedMaps, setExpandedMaps] = useState();
  const [warmingScenarioDescs, setWarmingScenarioDescs] = useState({});
  const [tempUnit, setTempUnit] = useState("°C" as types.TempUnit);
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [datasetDescriptionResponse, setWpDatasetDescriptionResponse] =
    useState<types.DatasetDescriptionResponse>();
  const [searchIsOpen, setSearchIsOpen] = useState(false);
  const [moreIsOpen, setMoreIsOpen] = useState(false);
  const [mapProjection, setMapProjection] = useState<Projection>({ name: "mercator" });
  const [activeClimateZoneLayers, setActiveClimateZoneLayers] = useState<string[]>();
  const [precipitationUnit, setPrecipitationUnit] = useState("mm" as types.PrecipitationUnit);
  const [showCountryBorders, setShowCountryBorders] = useState(true);
  const [showAboutMap, setShowAboutMap] = useState(false);
  const [showAllMapsModal, setShowAllMapsModal] = useState(false);
  const [aboutMapResources, setAboutMapResources] = useState<AboutMapResources>();
  const [percentileValue, setPercentileValue] = useState<BinningType>("mid");
  const [isComparisonMapActive, setIsComparisonMapActive] = useState(false);
  const [comparisonScenarioBefore, setComparisonScenarioBefore] = useState<number>(
    defaultDegreesForNonChangeMaps,
  );
  const [comparisonScenarioAfter, setComparisonScenarioAfter] = useState<number>(1.5);

  const value = useMemo(
    () => ({
      datasets,
      setDatasets,
      selectedDataset,
      setSelectedDataset,
      degrees,
      setDegrees,
      expandedCategory,
      setExpandedCategory,
      expandedMaps,
      setExpandedMaps,
      warmingScenarioDescs,
      setWarmingScenarioDescs,
      tempUnit,
      setTempUnit,
      showBaselineModal,
      setShowBaselineModal,
      showDescriptionModal,
      setShowDescriptionModal,
      datasetDescriptionResponse,
      setWpDatasetDescriptionResponse,
      searchIsOpen,
      setSearchIsOpen,
      moreIsOpen,
      setMoreIsOpen,
      mapProjection,
      setMapProjection,
      activeClimateZoneLayers,
      setActiveClimateZoneLayers,
      precipitationUnit,
      setPrecipitationUnit,
      showCountryBorders,
      setShowCountryBorders,
      showAboutMap,
      setShowAboutMap,
      showAllMapsModal,
      setShowAllMapsModal,
      aboutMapResources,
      setAboutMapResources,
      percentileValue,
      setPercentileValue,
      isComparisonMapActive,
      setIsComparisonMapActive,
      comparisonScenarioBefore,
      setComparisonScenarioBefore,
      comparisonScenarioAfter,
      setComparisonScenarioAfter,
    }),
    [
      datasets,
      selectedDataset,
      degrees,
      expandedCategory,
      expandedMaps,
      warmingScenarioDescs,
      tempUnit,
      showBaselineModal,
      showDescriptionModal,
      datasetDescriptionResponse,
      searchIsOpen,
      moreIsOpen,
      mapProjection,
      activeClimateZoneLayers,
      precipitationUnit,
      showCountryBorders,
      showAboutMap,
      showAllMapsModal,
      aboutMapResources,
      percentileValue,
      isComparisonMapActive,
      comparisonScenarioBefore,
      comparisonScenarioAfter,
    ],
  );

  return <DataContext.Provider value={value}>{props.children}</DataContext.Provider>;
}

export function useMapData(): State {
  return useContext(DataContext);
}
