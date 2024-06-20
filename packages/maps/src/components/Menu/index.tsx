import {
  createContext,
  useState,
  useContext,
  useRef,
  useMemo,
  createRef,
  ComponentType,
  PropsWithChildren,
  RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useAuth0 } from "@auth0/auth0-react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";
import { Projection } from "mapbox-gl";

import Drawer from "./Drawer";
import DrawerItem, { HeaderItem } from "./DrawerItem";
import Data from "./Data";
import Legend from "./Legend";
import MapStyle from "./MapStyle";
import UserInfo from "./UserInfo";
import { indexForMap } from "../../consts/mapConsts";
import PfIcon from "../../assets/icons/pf-icon.svg";
import DatabaseIcon from "../../assets/icons/database.svg";
import PaintIcon from "../../assets/icons/paint.svg";
import LegendIcon from "../../assets/icons/legend.svg";
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
interface MapStyleState {
  binHexColors?: string[];
  setColorScheme(binHexColors: any): void;
  bins?: number[];
  setBins(bins: any): void;
  binsType: string;
  setBinsType(binType: string): void;
  landColor: string;
  setLandColor(color: string): void;
  oceanColor: string;
  setOceanColor(color: string): void;
  showBoundaries: boolean;
  setShowBoundaries(show: boolean): void;
  showLabels: boolean;
  setShowLabels(show: boolean): void;
  mapProjection: Projection;
  setMapProjection(projection: Projection): void;
}

interface DataState {
  datasets: types.Map[];
  selectedDataset?: types.Map;
  degrees: number;
  filterByStatus: string;
  filterByCategory: string;
  showInspector: boolean;
  tempUnit: types.TempUnit;
  midValueShown: string;
  datasetDescriptionResponse?: types.DatasetDescriptionResponse;
  precipitationUnit: types.PrecipitationUnit;
  setDatasets(datasets: any): void;
  setSelectedDataset(dataset: any): void;
  setDegrees(degrees: any): void;
  setFilterByStatus(filter: any): void;
  setFilterByCategory(filter: any): void;
  setShowInspector(show: boolean): void;
  setTempUnit(arg: any): void;
  setMidValueShown(arg: any): void;
  setWpDatasetDescriptionResponse(
    datasetDescriptionResponse: types.DatasetDescriptionResponse,
  ): void;
  setPrecipitationUnit(arg: types.PrecipitationUnit): void;
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
          </DrawerItem>
          {mapStyle.binHexColors && mapStyle.bins && (
            <DrawerItem
              open={sidebar.isVisible}
              title={translate("menu.legend.title")}
              icon={LegendIcon}
            >
              <Legend />
            </DrawerItem>
          )}
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
      binHexColors: undefined,
      setColorScheme: () => {},
      bins: undefined,
      setBins: () => {},
      binsType: "",
      setBinsType: () => {},
      landColor: indexForMap.landColor,
      setLandColor: () => {},
      oceanColor: indexForMap.oceanColor,
      setOceanColor: () => {},
      showBoundaries: false,
      setShowBoundaries: () => {},
      showLabels: false,
      setShowLabels: () => {},
      mapProjection: { name: "mercator" },
      setMapProjection: () => {},
    },
    data: {
      datasets: [],
      selectedDataset: undefined,
      degrees: defaultDegreesForNonChangeMaps,
      filterByStatus: "published",
      filterByCategory: "all",
      showInspector: false,
      midValueShown: "",
      tempUnit: "°C",
      datasetDescriptionResponse: undefined,
      precipitationUnit: "mm",
      setDatasets: () => {},
      setSelectedDataset: () => {},
      setDegrees: () => {},
      setFilterByStatus: () => {},
      setFilterByCategory: () => {},
      setShowInspector: () => {},
      setTempUnit: () => {},
      setMidValueShown: () => {},
      setWpDatasetDescriptionResponse: () => {},
      setPrecipitationUnit: () => {},
    },
  };
}

function useSidebar(): SidebarState {
  const [isVisible, setIsVisible] = useState(false);
  const element = useRef(null);

  return useMemo(() => ({ element, isVisible, setIsVisible }), [element, isVisible]);
}

function useMapStyle(): MapStyleState {
  const [binHexColors, setColorScheme] = useState();
  const [bins, setBins] = useState();
  const [binsType, setBinsType] = useState("");
  const [landColor, setLandColor] = useState(indexForMap.landColor);
  const [oceanColor, setOceanColor] = useState(indexForMap.oceanColor);
  const [showBoundaries, setShowBoundaries] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [mapProjection, setMapProjection] = useState<Projection>({ name: "mercator" });

  return useMemo(
    () => ({
      binHexColors,
      setColorScheme,
      bins,
      setBins,
      binsType,
      setBinsType,
      landColor,
      setLandColor,
      oceanColor,
      setOceanColor,
      showBoundaries,
      setShowBoundaries,
      showLabels,
      setShowLabels,
      mapProjection,
      setMapProjection,
    }),
    [
      binHexColors,
      bins,
      binsType,
      landColor,
      oceanColor,
      showBoundaries,
      showLabels,
      mapProjection,
    ],
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
  const [showInspector, setShowInspector] = useState(false);
  const [tempUnit, setTempUnit] = useState("°C" as types.TempUnit);
  const [midValueShown, setMidValueShown] = useState("");
  const [datasetDescriptionResponse, setWpDatasetDescriptionResponse] =
    useState<types.DatasetDescriptionResponse>();
  const [precipitationUnit, setPrecipitationUnit] = useState("mm" as types.PrecipitationUnit);

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
      showInspector,
      setShowInspector,
      tempUnit,
      setTempUnit,
      midValueShown,
      setMidValueShown,
      datasetDescriptionResponse,
      setWpDatasetDescriptionResponse,
      precipitationUnit,
      setPrecipitationUnit,
    }),
    [
      datasets,
      selectedDataset,
      degrees,
      filterByStatus,
      filterByCategory,
      showInspector,
      tempUnit,
      midValueShown,
      datasetDescriptionResponse,
      precipitationUnit,
    ],
  );
}
