import React, { PropsWithChildren, useRef, useState } from "react";
import { AboutMapResources, types } from "@probable-futures/lib";

import { Props as ImportReviewProps } from "../components/Common/ImportReview";

type State = {
  climateData: types.Map[];
  selectedClimateData?: types.Map;
  warmingScenarioDescs: types.WarmingScenarioDescs;
  isClimateDataVisible: boolean;
  showMergeDataModal: boolean;
  mapRef: any;
  showLabels: boolean;
  showBorders: boolean;
  importReviewProps?: ImportReviewProps;
  showImportReviewModal: boolean;
  description955?: string;
  description9010?: string;
  showBaselineModal: boolean;
  showDescriptionModal: boolean;
  tempUnit: string;
  precipitationUnit: types.PrecipitationUnit;
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  searchIsOpen: boolean;
  showAboutMap: boolean;
  aboutMapResources?: AboutMapResources;
  setClimateData(arg: any): void;
  setSelectedClimateData(arg: any): void;
  setWarmingScenarioDescs(arg: any): void;
  setIsClimateDataVisible(arg: any): void;
  setShowMergeDataModal(arg: boolean): void;
  setShowLabels(arg: any): void;
  setShowBorders(arg: any): void;
  setImportReviewProps(arg: any): void;
  setShowImportReviewModal(arg: any): void;
  setDescription955(arg: any): void;
  setDescription9010(arg: any): void;
  setShowBaselineModal(arg: any): void;
  setShowDescriptionModal(arg: any): void;
  setTempUnit(arg: any): void;
  setWpDatasetDescriptionResponse(
    datasetDescriptionResponse: types.DatasetDescriptionResponse,
  ): void;
  setPrecipitationUnit(arg: types.PrecipitationUnit): void;
  setSearchIsOpen(arg: any): void;
  setShowAboutMap(arg: any): void;
  setAboutMapResources: (arg: AboutMapResources) => void;
};

const initialState = {
  climateData: [],
  selectedClimateData: undefined,
  warmingScenarioDescs: {},
  isClimateDataVisible: true,
  mapRef: undefined,
  showMergeDataModal: false,
  showLabels: false,
  showBorders: false,
  importReviewProps: undefined,
  showImportReviewModal: false,
  description955: undefined,
  description9010: undefined,
  showBaselineModal: false,
  showDescriptionModal: false,
  tempUnit: "°C",
  datasetDescriptionResponse: undefined,
  precipitationUnit: "mm" as types.PrecipitationUnit,
  searchIsOpen: false,
  showAboutMap: false,
  aboutMapResources: undefined,
  setAboutMapResources: () => {},
  setClimateData: () => {},
  setSelectedClimateData: () => {},
  setWarmingScenarioDescs: () => {},
  setIsClimateDataVisible: () => {},
  setShowMergeDataModal: () => {},
  setShowLabels: () => {},
  setShowBorders: () => {},
  setImportReviewProps: () => {},
  setShowImportReviewModal: () => {},
  setDescription955: () => {},
  setDescription9010: () => {},
  setShowBaselineModal: () => {},
  setShowDescriptionModal: () => {},
  setTempUnit: () => {},
  setWpDatasetDescriptionResponse: () => {},
  setPrecipitationUnit: () => {},
  setSearchIsOpen: () => {},
  setShowAboutMap: () => {},
};

const DataContext = React.createContext<State>(initialState);

export function DataProvider(props: PropsWithChildren<{}>): JSX.Element {
  const [climateData, setClimateData] = useState([]);
  const [selectedClimateData, setSelectedClimateData] = useState();
  const [warmingScenarioDescs, setWarmingScenarioDescs] = useState({});
  const [isClimateDataVisible, setIsClimateDataVisible] = useState(true);
  const [showMergeDataModal, setShowMergeDataModal] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showBorders, setShowBorders] = useState(false);
  const [importReviewProps, setImportReviewProps] = useState<ImportReviewProps>();
  const [showImportReviewModal, setShowImportReviewModal] = useState(false);
  const [description955, setDescription955] = useState();
  const [description9010, setDescription9010] = useState();
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [tempUnit, setTempUnit] = useState("°C");
  const [datasetDescriptionResponse, setWpDatasetDescriptionResponse] =
    useState<types.DatasetDescriptionResponse>();
  const [precipitationUnit, setPrecipitationUnit] = useState("mm" as types.PrecipitationUnit);
  const [searchIsOpen, setSearchIsOpen] = useState(false);
  const [showAboutMap, setShowAboutMap] = useState(false);
  const [aboutMapResources, setAboutMapResources] = useState<AboutMapResources>();

  const mapRef = useRef<any>(null);

  const value = React.useMemo(
    () => ({
      climateData,
      setClimateData,
      selectedClimateData,
      setSelectedClimateData,
      warmingScenarioDescs,
      setWarmingScenarioDescs,
      isClimateDataVisible,
      setIsClimateDataVisible,
      showMergeDataModal,
      setShowMergeDataModal,
      mapRef,
      showLabels,
      setShowLabels,
      showBorders,
      setShowBorders,
      importReviewProps,
      setImportReviewProps,
      showImportReviewModal,
      setShowImportReviewModal,
      description955,
      setDescription955,
      description9010,
      setDescription9010,
      showBaselineModal,
      setShowBaselineModal,
      showDescriptionModal,
      setShowDescriptionModal,
      tempUnit,
      setTempUnit,
      datasetDescriptionResponse,
      setWpDatasetDescriptionResponse,
      precipitationUnit,
      setPrecipitationUnit,
      searchIsOpen,
      setSearchIsOpen,
      showAboutMap,
      setShowAboutMap,
      aboutMapResources,
      setAboutMapResources,
    }),
    [
      climateData,
      selectedClimateData,
      warmingScenarioDescs,
      isClimateDataVisible,
      mapRef,
      showMergeDataModal,
      showLabels,
      showBorders,
      importReviewProps,
      showImportReviewModal,
      description955,
      description9010,
      showBaselineModal,
      showDescriptionModal,
      tempUnit,
      datasetDescriptionResponse,
      precipitationUnit,
      searchIsOpen,
      showAboutMap,
      aboutMapResources,
    ],
  );

  return <DataContext.Provider value={value}>{props.children}</DataContext.Provider>;
}

export function useMapData(): State {
  return React.useContext(DataContext);
}
