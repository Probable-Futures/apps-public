import React, { PropsWithChildren, useRef, useState } from "react";
import { types } from "@probable-futures/lib";

type State = {
  climateData: types.Map[];
  selectedClimateData?: types.Map;
  warmingScenarioDescs: types.WarmingScenarioDescs;
  isClimateDataVisible: boolean;
  mapRef: any;
  showLabels: boolean;
  showBorders: boolean;
  description955?: string;
  description9010?: string;
  tempUnit: string;
  precipitationUnit: types.PrecipitationUnit;
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  searchIsOpen: boolean;
  setClimateData(arg: any): void;
  setSelectedClimateData(arg: any): void;
  setWarmingScenarioDescs(arg: any): void;
  setIsClimateDataVisible(arg: any): void;
  setShowLabels(arg: any): void;
  setShowBorders(arg: any): void;
  setDescription955(arg: any): void;
  setDescription9010(arg: any): void;
  setTempUnit(arg: any): void;
  setWpDatasetDescriptionResponse(
    datasetDescriptionResponse: types.DatasetDescriptionResponse,
  ): void;
  setPrecipitationUnit(arg: types.PrecipitationUnit): void;
  setSearchIsOpen(arg: any): void;
};

const initialState = {
  climateData: [],
  selectedClimateData: undefined,
  warmingScenarioDescs: {},
  isClimateDataVisible: true,
  mapRef: undefined,
  showLabels: false,
  showBorders: false,
  description955: undefined,
  description9010: undefined,
  tempUnit: "°C",
  datasetDescriptionResponse: undefined,
  precipitationUnit: "mm" as types.PrecipitationUnit,
  searchIsOpen: false,
  setClimateData: () => {},
  setSelectedClimateData: () => {},
  setWarmingScenarioDescs: () => {},
  setIsClimateDataVisible: () => {},
  setShowLabels: () => {},
  setShowBorders: () => {},
  setDescription955: () => {},
  setDescription9010: () => {},
  setTempUnit: () => {},
  setWpDatasetDescriptionResponse: () => {},
  setPrecipitationUnit: () => {},
  setSearchIsOpen: () => {},
};

const DataContext = React.createContext<State>(initialState);

export function DataProvider(props: PropsWithChildren<{}>): JSX.Element {
  const [climateData, setClimateData] = useState([]);
  const [selectedClimateData, setSelectedClimateData] = useState();
  const [warmingScenarioDescs, setWarmingScenarioDescs] = useState({});
  const [isClimateDataVisible, setIsClimateDataVisible] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [showBorders, setShowBorders] = useState(false);
  const [description955, setDescription955] = useState();
  const [description9010, setDescription9010] = useState();
  const [tempUnit, setTempUnit] = useState("°C");
  const [datasetDescriptionResponse, setWpDatasetDescriptionResponse] =
    useState<types.DatasetDescriptionResponse>();
  const [precipitationUnit, setPrecipitationUnit] = useState("mm" as types.PrecipitationUnit);
  const [searchIsOpen, setSearchIsOpen] = useState(false);

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
      mapRef,
      showLabels,
      setShowLabels,
      showBorders,
      setShowBorders,
      description955,
      setDescription955,
      description9010,
      setDescription9010,
      tempUnit,
      setTempUnit,
      datasetDescriptionResponse,
      setWpDatasetDescriptionResponse,
      precipitationUnit,
      setPrecipitationUnit,
      searchIsOpen,
      setSearchIsOpen,
    }),
    [
      climateData,
      selectedClimateData,
      warmingScenarioDescs,
      isClimateDataVisible,
      mapRef,
      showLabels,
      showBorders,
      description955,
      description9010,
      tempUnit,
      datasetDescriptionResponse,
      precipitationUnit,
      searchIsOpen,
    ],
  );

  return <DataContext.Provider value={value}>{props.children}</DataContext.Provider>;
}

export function useMapData(): State {
  return React.useContext(DataContext);
}
