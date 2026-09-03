import {
  createContext,
  useState,
  useContext,
  useRef,
  useMemo,
  createRef,
  ComponentType,
  Dispatch,
  PropsWithChildren,
  RefObject,
  SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import { useAuth0 } from "@auth0/auth0-react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";
import { BinningType } from "@probable-futures/lib/src/utils/colors";
import { Projection } from "mapbox-gl";

import Drawer from "./Drawer";
import DrawerItem, { HeaderItem } from "./DrawerItem";
import Data from "./Data";
import Legend from "./Legend";
import MapStyle from "./MapStyle";
import UserInfo from "./UserInfo";
import { ComparisonMode, indexForMap } from "../../consts/mapConsts";
import PfIcon from "../../assets/icons/pf-icon.svg";
import DatabaseIcon from "../../assets/icons/database.svg";
import PaintIcon from "../../assets/icons/paint.svg";
import { useTranslation } from "../../contexts/TranslationContext";
import { defaultDegreesForNonChangeMaps } from "../../contexts/DataContext";

type SelectRef = (context: MenuState) => RefObject<HTMLElement>;

interface MenuState {
  controls: RefObject<HTMLDivElement>;
  sidebar: SidebarState;
  mapStyle: MapStyleState;
  data: DataState;
}

interface SidebarState {
  element: RefObject<HTMLElement>;
  isVisible: boolean;
  setIsVisible(isVisible: boolean): void;
}

interface DynamicStyleVariables {
  binHexColors?: string[];
  bins?: number[];
}

export type { ComparisonMode } from "../../consts/mapConsts";

interface MapStyleState {
  binsType: string;
  setBinsType(binType: string): void;
  landColor: string;
  setLandColor(color: string): void;
  oceanColor: string;
  setOceanColor(color: string): void;
  mapProjection: Projection;
  setMapProjection(projection: Projection): void;
  dynamicStyleVariables?: DynamicStyleVariables;
  setDynamicStyleVariables: Dispatch<SetStateAction<DynamicStyleVariables | undefined>>;
}

interface DataState {
  datasets: types.Map[];
  selectedDataset?: types.Map;
  degrees: number;
  filterByStatus: string;
  filterByCategory: string;
  filterBySubCategory: string;
  showInspector: boolean;
  tempUnit: types.TempUnit;
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  precipitationUnit: types.PrecipitationUnit;
  percentileValue: BinningType;
  comparisonMode: ComparisonMode;
  comparisonRestored: boolean;
  versionBefore?: types.Map;
  versionAfter?: types.Map;
  showEra5: boolean;
  /** Show a change map's absolute rendering instead of its change values. */
  showAbsolute: boolean;
  /** Whether the published-coverage table is open. */
  showCoverage: boolean;
  setComparisonRestored(restored: boolean): void;
  setDatasets(datasets: any): void;
  setSelectedDataset(dataset: any): void;
  setDegrees(degrees: any): void;
  setFilterByStatus(filter: any): void;
  setFilterByCategory(filter: any): void;
  setFilterBySubCategory(filter: any): void;
  setShowInspector(show: boolean): void;
  setTempUnit(arg: any): void;
  setWpDatasetDescriptionResponse(
    datasetDescriptionResponse: types.DatasetDescriptionResponse,
  ): void;
  setPrecipitationUnit(arg: types.PrecipitationUnit): void;
  setPercentileValue(arg: BinningType): void;
  setComparisonMode(mode: ComparisonMode): void;
  setVersionBefore(dataset?: types.Map): void;
  setVersionAfter(dataset?: types.Map): void;
  setShowEra5(show: boolean): void;
  setShowAbsolute(show: boolean): void;
  setShowCoverage(show: boolean): void;
}

const MenuContext = createContext(getInitialState());

export const Controls = createPortalComponent(({ controls }) => controls);
export const Sidebar = createPortalComponent(({ sidebar }) => sidebar.element);

const DrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
`;

export function MenuProvider(props: PropsWithChildren<{}>): JSX.Element {
  const controls = useRef<HTMLDivElement>(null);
  const sidebar = useSidebar();
  const mapStyle = useMapStyle();
  const data = useData();
  const { isAuthenticated } = useAuth0();
  const { translate } = useTranslation();
  const value = useMemo(
    () => ({ controls, sidebar, mapStyle, data }),
    [controls, sidebar, mapStyle, data],
  );

  function hideSidebar(): void {
    sidebar.setIsVisible(false);
  }

  function showSidebar(): void {
    sidebar.setIsVisible(true);
  }

  return (
    <MenuContext.Provider value={value}>
      {props.children}

      <Drawer open={sidebar.isVisible} showSidebar={showSidebar} hideSidebar={hideSidebar}>
        <HeaderItem
          open={sidebar.isVisible}
          title={translate("title")}
          icon={PfIcon}
          onClick={hideSidebar}
          showLoader
        />
        <DrawerContent>
          <DrawerItem
            open={sidebar.isVisible}
            title={translate("menu.data.title")}
            icon={DatabaseIcon}
          >
            <Data />
          </DrawerItem>
          <DrawerItem
            open={sidebar.isVisible}
            title={translate("menu.mapStyle.title")}
            icon={PaintIcon}
          >
            <MapStyle />
            {/* Legend renders null until a ramp exists, which is what used to gate
                its own drawer section. */}
            <Legend />
          </DrawerItem>
        </DrawerContent>
        {isAuthenticated && sidebar.isVisible && <UserInfo />}
      </Drawer>
    </MenuContext.Provider>
  );
}

function createPortalComponent(
  selectRef: SelectRef,
): ComponentType<{ children?: React.ReactNode }> {
  const empty = document.createElement("div");

  return ({ children }) => {
    const context = useContext(MenuContext);
    const element = selectRef(context).current ?? empty;

    return <>{createPortal(children, element)}</>;
  };
}

function getInitialState(): MenuState {
  return {
    controls: createRef(),
    sidebar: {
      element: createRef(),
      isVisible: false,
      setIsVisible: () => {},
    },
    mapStyle: {
      binsType: "",
      setBinsType: () => {},
      landColor: indexForMap.landColor,
      setLandColor: () => {},
      oceanColor: indexForMap.oceanColor,
      setOceanColor: () => {},
      mapProjection: { name: "mercator" },
      setMapProjection: () => {},
      dynamicStyleVariables: undefined,
      setDynamicStyleVariables: () => {},
    },
    data: {
      datasets: [],
      selectedDataset: undefined,
      degrees: defaultDegreesForNonChangeMaps,
      filterByStatus: "published",
      filterByCategory: "all",
      filterBySubCategory: "all",
      showInspector: false,
      tempUnit: "°C",
      datasetDescriptionResponse: undefined,
      precipitationUnit: "mm",
      percentileValue: "mid",
      comparisonMode: "none",
      comparisonRestored: false,
      versionBefore: undefined,
      versionAfter: undefined,
      showEra5: false,
      showAbsolute: false,
      showCoverage: false,
      setComparisonRestored: () => {},
      setShowEra5: () => {},
      setShowAbsolute: () => {},
      setShowCoverage: () => {},
      setDatasets: () => {},
      setSelectedDataset: () => {},
      setDegrees: () => {},
      setFilterByStatus: () => {},
      setFilterByCategory: () => {},
      setFilterBySubCategory: () => {},
      setShowInspector: () => {},
      setTempUnit: () => {},
      setWpDatasetDescriptionResponse: () => {},
      setPrecipitationUnit: () => {},
      setPercentileValue: () => {},
      setComparisonMode: () => {},
      setVersionBefore: () => {},
      setVersionAfter: () => {},
    },
  };
}

function useSidebar(): SidebarState {
  const [isVisible, setIsVisible] = useState(false);
  const element = useRef(null);

  return useMemo(() => ({ element, isVisible, setIsVisible }), [element, isVisible]);
}

function useMapStyle(): MapStyleState {
  const [dynamicStyleVariables, setDynamicStyleVariables] = useState<DynamicStyleVariables>();
  const [binsType, setBinsType] = useState("");
  const [landColor, setLandColor] = useState(indexForMap.landColor);
  const [oceanColor, setOceanColor] = useState(indexForMap.oceanColor);
  const [mapProjection, setMapProjection] = useState<Projection>({ name: "mercator" });

  return useMemo(
    () => ({
      dynamicStyleVariables,
      setDynamicStyleVariables,
      binsType,
      setBinsType,
      landColor,
      setLandColor,
      oceanColor,
      setOceanColor,
      mapProjection,
      setMapProjection,
    }),
    [dynamicStyleVariables, binsType, landColor, oceanColor, mapProjection],
  );
}

export function useMenu(): MenuState {
  return useContext(MenuContext);
}

function useData(): DataState {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState();
  const [degrees, setDegrees] = useState(defaultDegreesForNonChangeMaps);
  const [filterByStatus, setFilterByStatus] = useState("published");
  const [filterByCategory, setFilterByCategory] = useState("all");
  const [filterBySubCategory, setFilterBySubCategory] = useState("all");
  const [showInspector, setShowInspector] = useState(false);
  const [tempUnit, setTempUnit] = useState("°C" as types.TempUnit);
  const [datasetDescriptionResponse, setWpDatasetDescriptionResponse] =
    useState<types.DatasetDescriptionResponse>();
  const [precipitationUnit, setPrecipitationUnit] = useState("mm" as types.PrecipitationUnit);
  const [percentileValue, setPercentileValue] = useState<BinningType>("mid");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("none");
  const [comparisonRestored, setComparisonRestored] = useState(false);
  const [versionBefore, setVersionBefore] = useState<types.Map | undefined>();
  const [versionAfter, setVersionAfter] = useState<types.Map | undefined>();
  const [showEra5, setShowEra5] = useState(false);
  const [showAbsolute, setShowAbsolute] = useState(false);
  const [showCoverage, setShowCoverage] = useState(false);

  return useMemo(
    () => ({
      datasets,
      setDatasets,
      selectedDataset,
      setSelectedDataset,
      degrees,
      setDegrees,
      filterByStatus,
      setFilterByStatus,
      filterByCategory,
      setFilterByCategory,
      filterBySubCategory,
      setFilterBySubCategory,
      showInspector,
      setShowInspector,
      tempUnit,
      setTempUnit,
      datasetDescriptionResponse,
      setWpDatasetDescriptionResponse,
      precipitationUnit,
      setPrecipitationUnit,
      percentileValue,
      setPercentileValue,
      comparisonMode,
      setComparisonMode,
      comparisonRestored,
      setComparisonRestored,
      versionBefore,
      setVersionBefore,
      versionAfter,
      setVersionAfter,
      showEra5,
      setShowEra5,
      showAbsolute,
      setShowAbsolute,
      showCoverage,
      setShowCoverage,
    }),
    [
      datasets,
      selectedDataset,
      degrees,
      filterByStatus,
      filterByCategory,
      filterBySubCategory,
      showInspector,
      tempUnit,
      datasetDescriptionResponse,
      precipitationUnit,
      percentileValue,
      comparisonMode,
      comparisonRestored,
      versionBefore,
      versionAfter,
      showEra5,
      showAbsolute,
      showCoverage,
    ],
  );
}
