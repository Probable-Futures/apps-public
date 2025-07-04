import { createContext, useState, useMemo, useContext, PropsWithChildren } from "react";
import { Projection } from "mapbox-gl";

import { types, AboutMapResources } from "@probable-futures/lib";

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
  stories: types.Story[];
  selectedStory?: types.Story;
  showStory: boolean;
  warmingScenarioDescs: types.WarmingScenarioDescs;
  storySubmission?: string;
  tempUnit: types.TempUnit;
  showMarkers: boolean;
  activeStoryTooltip?: number;
  showBaselineModal: boolean;
  showDescriptionModal: boolean;
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  searchIsOpen: boolean;
  moreIsOpen: boolean;
  mapProjection: Projection;
  activeClimateZoneLayers?: string[];
  precipitationUnit: types.PrecipitationUnit;
  showCountryBorders: boolean;
  temporaryShowMarkers: boolean;
  showAboutMap: boolean;
  showAllMapsModal: boolean;
  aboutMapResources?: AboutMapResources;
  setShowAllMapsModal: (arg: boolean) => void;
  setShowAboutMap: (arg: boolean) => void;
  setAboutMapResources: (arg: AboutMapResources) => void;
  setDatasets(arg: any): void;
  setSelectedDataset(arg: any): void;
  setDegrees(arg: any): void;
  setExpandedCategory(arg: any): void;
  setExpandedMaps(arg: any): void;
  setStories(arg: any): void;
  setSelectedStory(arg: any): void;
  setShowStory(arg: any): void;
  setWarmingScenarioDescs(arg: any): void;
  setStorySubmission(arg: any): void;
  setTempUnit(arg: types.TempUnit): void;
  setShowMarkers(arg: any): void;
  setActiveStoryTooltip(arg: any): void;
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
  setTemporaryShowMarkers(arg: any): void;
};

const initialState = {
  datasets: [],
  selectedDataset: undefined,
  degrees: defaultDegreesForNonChangeMaps,
  expandedCategory: undefined,
  expandedMaps: undefined,
  stories: [],
  selectedStory: undefined,
  showStory: false,
  warmingScenarioDescs: {},
  storySubmission: undefined,
  tempUnit: "°C" as types.TempUnit,
  showMarkers: false,
  activeStoryTooltip: undefined,
  showBaselineModal: false,
  showDescriptionModal: false,
  datasetDescriptionResponse: undefined,
  searchIsOpen: false,
  moreIsOpen: false,
  mapProjection: { name: "mercator" } as Projection,
  activeClimateZoneLayers: undefined,
  precipitationUnit: "mm" as types.PrecipitationUnit,
  showCountryBorders: true,
  temporaryShowMarkers: false,
  showAboutMap: false,
  showAllMapsModal: false,
  aboutMapResources: undefined,
  setShowAllMapsModal: () => {},
  setShowAboutMap: () => {},
  setAboutMapResources: () => {},
  setDatasets: () => {},
  setSelectedDataset: () => {},
  setDegrees: () => {},
  setExpandedCategory: () => {},
  setExpandedMaps: () => {},
  setStories: () => {},
  setSelectedStory: () => {},
  setShowStory: () => {},
  setWarmingScenarioDescs: () => {},
  setStorySubmission: () => {},
  setTempUnit: () => {},
  setShowMarkers: () => {},
  setActiveStoryTooltip: () => {},
  setShowBaselineModal: () => {},
  setShowDescriptionModal: () => {},
  setWpDatasetDescriptionResponse: () => {},
  setSearchIsOpen: () => {},
  setMoreIsOpen: () => {},
  setMapProjection: () => {},
  setActiveClimateZoneLayers: () => {},
  setPrecipitationUnit: () => {},
  setShowCountryBorders: () => {},
  setTemporaryShowMarkers: () => {},
};

const DataContext = createContext<State>(initialState);

export function DataProvider(props: PropsWithChildren<{}>): JSX.Element {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState();
  const [degrees, setDegrees] = useState(defaultDegreesForNonChangeMaps);
  const [expandedCategory, setExpandedCategory] = useState();
  const [expandedMaps, setExpandedMaps] = useState();
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState();
  const [showStory, setShowStory] = useState(false);
  const [warmingScenarioDescs, setWarmingScenarioDescs] = useState({});
  const [storySubmission, setStorySubmission] = useState();
  const [tempUnit, setTempUnit] = useState("°C" as types.TempUnit);
  const [showMarkers, setShowMarkers] = useState(false);
  const [activeStoryTooltip, setActiveStoryTooltip] = useState<number>();
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
  const [temporaryShowMarkers, setTemporaryShowMarkers] = useState(false);
  const [showAboutMap, setShowAboutMap] = useState(false);
  const [showAllMapsModal, setShowAllMapsModal] = useState(false);
  const [aboutMapResources, setAboutMapResources] = useState<AboutMapResources>();

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
      stories,
      setStories,
      selectedStory,
      setSelectedStory,
      showStory,
      setShowStory,
      warmingScenarioDescs,
      setWarmingScenarioDescs,
      storySubmission,
      setStorySubmission,
      tempUnit,
      setTempUnit,
      showMarkers,
      setShowMarkers,
      activeStoryTooltip,
      setActiveStoryTooltip,
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
      temporaryShowMarkers,
      setTemporaryShowMarkers,
      showAboutMap,
      setShowAboutMap,
      showAllMapsModal,
      setShowAllMapsModal,
      aboutMapResources,
      setAboutMapResources,
    }),
    [
      datasets,
      selectedDataset,
      degrees,
      expandedCategory,
      expandedMaps,
      stories,
      selectedStory,
      showStory,
      warmingScenarioDescs,
      storySubmission,
      tempUnit,
      showMarkers,
      activeStoryTooltip,
      showBaselineModal,
      showDescriptionModal,
      datasetDescriptionResponse,
      searchIsOpen,
      moreIsOpen,
      mapProjection,
      activeClimateZoneLayers,
      precipitationUnit,
      showCountryBorders,
      temporaryShowMarkers,
      showAboutMap,
      showAllMapsModal,
      aboutMapResources,
    ],
  );

  return <DataContext.Provider value={value}>{props.children}</DataContext.Provider>;
}

export function useMapData(): State {
  return useContext(DataContext);
}
