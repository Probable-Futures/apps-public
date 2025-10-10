import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import styled from "styled-components";
// @ts-ignore
import { mapStyleChange, updateMap, toggleModal, fitBounds } from "kepler.gl/actions";
//@ts-ignore
import { EXPORT_IMAGE_ID } from "kepler.gl";
import { useLocation } from "react-router-dom";
import { utils, consts } from "@probable-futures/lib";
import { components, contexts } from "@probable-futures/components-lib";
import { Helmet } from "react-helmet";
import { Feature } from "@probable-futures/components-lib/src/hooks/useGeocoder";
import { useMediaQuery } from "react-responsive";

import { KeplerGl } from "./KeplerDI";
import { DEFAULT_PF_DATASET_ID, MAP_ID } from "../../consts/MapConsts";
import { MAPBOX_ACCESS_TOKEN } from "../../consts/env";
import { AppDispatch, RootState } from "../../store/store";
import { useMapData } from "../../contexts/DataContext";
import MergeData, { UploadResponse } from "../Dashboard/Project/MergeData";
import ShareProject from "../Dashboard/Project/ShareProject";
import DownloadProject from "../Dashboard/Project/DownloadProject";
import useMapsApi from "../../utils/useMapsApi";
import useWPApi from "../../utils/useWPApi";
import MapControls from "./MapControls";
import useMapActions from "../../utils/useMapActions";
import ImportReview from "../Common/ImportReview";
import useProjectApi from "../../utils/useProjectApi";
import useShareProjectApi from "../../utils/useShareProjectApi";
import useFeaturePopup from "../../utils/useFeaturePopup";
import FeaturePopup from "../Common/FeaturePopup";
import useProjectInit from "../../utils/useProjectInit";
import useEnrichSingleDataset, {
  FinalEnrichmentDataset,
} from "../../utils/useSingleDatasetEnrichment";
import { UPDATE_CLICKED_MAP_INFO } from "../../store/actions";
import ConfirmationModal from "../Common/ConfirmationModal";
import { colors, size } from "../../consts";
import useDegreesSelector from "../../utils/useDegreesSelector";
import useExportMapAsHTML from "../../utils/useExportMapAsHTML";
import MapSelection from "./MapSelection";
import { useDatasetChangeHandler } from "../../utils/useDatasetChangeHandler";

const mapStateToProps = (state: RootState) => state;
const dispatchToProps = (dispatch: AppDispatch) => ({ dispatch });

const connector = connect(mapStateToProps, dispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

const localeMessages = {
  en: {
    mapLayers: {
      terrain: "Terrain",
    },
  },
};

const Container = styled.div`
  #map-header {
    z-index: 5;
  }
  position: relative;
  overflow: hidden;
`;

const SharedProjectHeader = styled.div`
  border: 1px solid rgb(182, 180, 183);
  background-color: ${colors.white};
  padding: 15px 10px;
  position: fixed;
  top: 10px;
  left: 270px;
  border-radius: 6px;
`;

const SharedProjectTitle = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  line-height: 11px;
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const SharedProjectDescription = styled.p`
  margin: 0;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: bold;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DegreesWrapper = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  box-sizing: content-box;
  z-index: 3;
  width: 600px;
`;

type LinkProps = {
  bottom?: string;
  activeSidePanel: boolean;
};

const Link = styled.a`
  position: absolute;
  left: 300px;
  ${({ activeSidePanel }: LinkProps) => !activeSidePanel && "transition: left 250ms; left: 40px;"}
  padding: 0 5px;
  background-color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  font-family: Helvetica Neue, Arial, Helvetica, sans-serif;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.75);
  z-index: 3;
  transition: z-index 0.2s step-end;
  cursor: pointer;
  text-decoration: none;
  bottom: ${({ bottom }: LinkProps) => bottom ?? 0};
`;

const DegreesMobileContainer = styled.div`
  position: absolute;
  bottom: 0;
  box-sizing: content-box;
  z-index: 4;
  width: 100%;
  left: 40px;
`;

function easeCubic(t: any) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

const InteractiveMap = (props: PropsFromRedux) => {
  const location = useLocation();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [finalEnrichmentDataset, setFinalEnrichmentDataset] = useState<FinalEnrichmentDataset>();
  const [windowDimension, setDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const { project, keplerGl, dispatch } = props;

  useWPApi();

  const { projectSharedData } = useShareProjectApi();

  useEnrichSingleDataset({ onEnrichmentFinish: setFinalEnrichmentDataset });

  const onDatasetChange = useDatasetChangeHandler();

  const { setDefaultColorField } = useMapActions({
    dispatch,
    keplerGl,
    project,
  });

  const {
    selectedClimateData,
    isClimateDataVisible,
    mapRef,
    climateData,
    showMergeDataModal,
    importReviewProps,
    setShowMergeDataModal,
    setImportReviewProps,
    showImportReviewModal,
    setShowImportReviewModal,
    showBaselineModal,
    setShowBaselineModal,
    showDescriptionModal,
    setShowDescriptionModal,
    warmingScenarioDescs,
    datasetDescriptionResponse,
    tempUnit,
    precipitationUnit,
    searchIsOpen,
    showAboutMap,
    setSearchIsOpen,
    setShowAboutMap,
    aboutMapResources,
  } = useMapData();
  const isLaptop = useMediaQuery({
    query: `(min-width: ${size.laptop})`,
  });

  const isTablet = useMediaQuery({
    query: `(max-width: ${size.tabletMax})`,
  });

  const { onButtonClick } = useDegreesSelector();

  const degrees = project.mapConfig.pfMapConfig.warmingScenario;
  const percentileValue = project.mapConfig.pfMapConfig.percentileValue;
  const bins = project.mapConfig.pfMapConfig.bins || selectedClimateData?.stops;
  const showLabels = project.mapConfig.pfMapConfig.showLabels;
  const showBorders = project.mapConfig.pfMapConfig.showBorders;
  const binHexColors = selectedClimateData?.binHexColors;
  const mapGeneralStyles = useRef({
    bins,
    degrees,
    percentileValue,
    showBorders,
    showLabels,
    binHexColors,
  });

  const {
    popupVisible,
    onClose: closePopup,
    feature,
    setPopupVisible,
  } = useFeaturePopup({
    degrees,
    clickedMapInfo: project?.clickedMapInfo,
    dispatch: dispatch,
  });

  const activeSidePanel = !!keplerGl[MAP_ID]?.uiState?.activeSidePanel;
  const isSharedProject = !!project.slugId;

  const { onExportClick } = useExportMapAsHTML({
    selectedClimateData,
    bins,
    tempUnit,
    degrees,
    showBorders,
    showLabels,
    percentileValue,
    binHexColors,
    datasetDescriptionResponse,
    precipitationUnit,
  });

  const updateMapStyles = useCallback(() => {
    const {
      current: { bins, degrees, showBorders, showLabels, percentileValue, binHexColors },
    } = mapGeneralStyles;
    if (bins && binHexColors) {
      const mapBox = mapRef.current.getMap();
      const { layers } = mapBox?.getStyle();

      const dataLayerPaintProperties = utils.getMapLayerColors(
        binHexColors,
        bins,
        degrees,
        percentileValue,
      );

      // Set paint properties for data layers
      layers.forEach((layer: any) => {
        const { id, type } = layer;

        if (id.includes(consts.DATA_LAYER_ID_PREFIX)) {
          mapBox?.setPaintProperty(id, "fill-color", dataLayerPaintProperties);
          mapBox?.setPaintProperty(id, "fill-antialias", ["step", ["zoom"], false, 6, true]);
          mapBox?.setPaintProperty(id, "fill-outline-color", "#ffffff");
        } else if (id.includes("boundary")) {
          mapBox.setLayoutProperty(id, "visibility", showBorders ? "visible" : "none");
        } else if (type === "symbol" || id.includes("road")) {
          mapBox.setLayoutProperty(id, "visibility", showLabels ? "visible" : "none");
        }
      });
    }
  }, [mapRef]);

  const takeScreenshot = useCallback(() => {
    if (mapRef.current && keplerGl[MAP_ID]) {
      const map = mapRef.current.getMap();
      if (map) {
        const style = map.getStyle();
        const updatedStyle = JSON.parse(JSON.stringify(style));
        keplerGl[MAP_ID].mapStyle.bottomMapStyle = updatedStyle;
      }
    }
    dispatch(toggleModal(EXPORT_IMAGE_ID));
  }, [dispatch, keplerGl, mapRef]);

  useEffect(() => {
    const handleResize = () => {
      setDimension({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { createProject } = useProjectApi({
    setDefaultColorField,
    percentileValue,
    degrees,
  });

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.on("style.load", () => updateMapStyles());
    }
  }, [mapRef, updateMapStyles]);

  useEffect(() => {
    mapGeneralStyles.current = {
      bins,
      degrees,
      showBorders,
      showLabels,
      percentileValue,
      binHexColors,
    };
    if (mapRef.current && bins) {
      const map = mapRef.current.getMap();
      if (map.loaded()) {
        updateMapStyles();
      }
    }
  }, [
    mapRef,
    bins,
    percentileValue,
    degrees,
    showBorders,
    showLabels,
    binHexColors,
    updateMapStyles,
  ]);

  const { callInit } = useProjectInit();

  useMapsApi();

  const onDatasetUploadFinish = useCallback(
    (uploadResponse: UploadResponse, process: boolean, pId: string, pfDatasetId?: number) => {
      const upload = uploadResponse.datasetUploadNode;
      setShowMergeDataModal(false);
      if (process) {
        setShowImportReviewModal(true);
        setImportReviewProps({
          fileName: uploadResponse.datasetUploadNode.id,
          successCount: upload.processedWithCoordinatesRowCount,
          errorsCount:
            (upload?.processingErrors?.invalid_rows.length || 0) +
            (upload?.processingErrors?.errors.length || 0) +
            (upload?.processingWithCoordinatesErrors?.errors.length || 0),
          typeOfErros: uploadResponse?.errors.map((error) => error.message),
          onGoBack: () => {
            setShowMergeDataModal(true);
            setShowImportReviewModal(false);
          },
          onComplete: () => {
            setShowImportReviewModal(false);
            callInit(pId, pfDatasetId || DEFAULT_PF_DATASET_ID, true);
          },
          onClose: () => {
            setShowImportReviewModal(false);
            callInit(pId, pfDatasetId || DEFAULT_PF_DATASET_ID, true);
          },
          getFileData: () =>
            upload?.processingErrors?.invalid_rows.map((invalidRow) => invalidRow.row.raw) || [],
        });
      } else {
        callInit(pId, pfDatasetId || DEFAULT_PF_DATASET_ID, true);
      }
    },
    [setShowMergeDataModal, callInit, setImportReviewProps, setShowImportReviewModal],
  );

  useEffect(() => {
    if (selectedClimateData && isClimateDataVisible) {
      dispatch(mapStyleChange(selectedClimateData.dataset.slug));
    } else if (!isClimateDataVisible) {
      dispatch(mapStyleChange("light"));
    }
    setPopupVisible(false);
    dispatch({
      type: UPDATE_CLICKED_MAP_INFO,
      payload: { clickedMapInfo: undefined },
    });
  }, [selectedClimateData, isClimateDataVisible, dispatch, setPopupVisible]);

  const changeZoom = useCallback((zoom: number) => dispatch(updateMap({ zoom })), [dispatch]);

  // Sometimes after adding a new dataset to a project, kepler resets the zoom to be less than the minimum allowed zoom.
  // So we do this to force the zoom to stay above the MIN_ZOOM.
  useEffect(() => {
    const zoom = keplerGl[MAP_ID]?.mapState?.zoom;
    if (!isNaN(zoom) && zoom < consts.MIN_ZOOM) {
      changeZoom(consts.MIN_ZOOM);
    }
  }, [keplerGl, changeZoom]);

  const yearType = useMemo(() => {
    if (selectedClimateData) {
      const index = percentileValue === "low" ? 0 : percentileValue === "high" ? 2 : 1;
      const year = selectedClimateData.dataLabels[index];
      return consts.datasetsWithMidValuesOnly.indexOf(selectedClimateData.dataset.id) === -1
        ? year
        : "";
    }
    return "";
  }, [percentileValue, selectedClimateData]);

  const onShareClick = () => setShowShareModal(true);

  const onDownloadClick = () => setShowDownloadModal(true);

  const reloadEnrichedDataset = () => {
    if (!finalEnrichmentDataset) {
      return;
    }
    const { projectId, pfDatasetId } = finalEnrichmentDataset;
    if (projectId && pfDatasetId) {
      callInit(projectId, pfDatasetId, false, true);
    }
    setFinalEnrichmentDataset(undefined);
  };

  const renderSharedProjectHeader = () => {
    if (!selectedClimateData || !project.slugId || !projectSharedData) {
      return null;
    }
    const datasetTitles = projectSharedData.files.map((file) => file.name);
    return (
      <SharedProjectHeader>
        <SharedProjectTitle>Custom Data</SharedProjectTitle>
        <SharedProjectDescription>{datasetTitles.join(" · ")}</SharedProjectDescription>
      </SharedProjectHeader>
    );
  };

  const renderBottomLinks = () => {
    if (!selectedClimateData) {
      return null;
    }
    return (
      <Link
        bottom={"2px"}
        target="_blank"
        rel="noopener noreferrer"
        href={consts.MAP_VERSION_URL}
        activeSidePanel={activeSidePanel}
      >{`Probable Futures map v${selectedClimateData.mapVersion}`}</Link>
    );
  };

  const renderHelmetComponent = () => {
    let description = `Explore this custom map: ${selectedClimateData?.name}`;
    if (yearType) {
      description = description + ` · ${yearType} year`;
    }
    return (
      <Helmet>
        <meta name="description" content={description} />
        <meta name="og:description" content={description} />
        <meta name="twitter:description" content={description} />
      </Helmet>
    );
  };

  const handleOnFly = useCallback(
    (feature: Feature) => {
      dispatch(
        updateMap({
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
          transitionDuration: 1500,
          transitionEasing: easeCubic,
        }),
      );

      setTimeout(() => {
        dispatch(fitBounds(feature.bbox));
      }, 1400);
    },
    [dispatch],
  );
  const getMapboxRef = (ref: any) => {
    if (ref && !mapRef.current) {
      mapRef.current = ref;
      const map = mapRef.current.getMap();
      map.on("style.load", () => updateMapStyles());
      map.on("sourcedata", (e: any) => e.tile && setShowLoader(true));
      map.on("idle", () => setShowLoader(false));
    }
  };

  const isMapOrDataLoading = useMemo(() => {
    const datasetEnrichment = project.datasetEnrichment;
    const isEnrichingInProgress =
      datasetEnrichment.index !== undefined &&
      (datasetEnrichment.processingStatus === "in progress" ||
        datasetEnrichment.enrichmentStatus === "in progress");
    const isFetchingDatasets = project.isFetchingDatasets || !project.addedDataToMap;

    return showLoader || isEnrichingInProgress || isFetchingDatasets;
  }, [project.datasetEnrichment, project.addedDataToMap, project.isFetchingDatasets, showLoader]);

  return (
    <>
      {renderHelmetComponent()}
      <Container>
        <components.Loader show={isMapOrDataLoading} />
        <MapSelection activeSidePanel={activeSidePanel} isSharedProject={isSharedProject} />
        {selectedClimateData && (
          <contexts.ThemeProvider theme="light">
            {isTablet ? (
              <DegreesMobileContainer>
                <components.DegreesFooter
                  degrees={degrees}
                  warmingScenarioDescs={warmingScenarioDescs}
                  showBaselineModal={showBaselineModal}
                  onWarmingScenarioClick={onButtonClick}
                />
              </DegreesMobileContainer>
            ) : (
              <DegreesWrapper>
                <components.Degrees
                  degrees={degrees}
                  warmingScenarioDescs={warmingScenarioDescs}
                  showBaselineModal={showBaselineModal}
                  onWarmingScenarioClick={onButtonClick}
                  onAboutMapClick={() => {
                    setShowAboutMap(true);
                  }}
                />
              </DegreesWrapper>
            )}
          </contexts.ThemeProvider>
        )}
        <KeplerGl
          mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
          id={MAP_ID}
          width={windowDimension.width}
          height={windowDimension.height}
          localeMessages={localeMessages}
          mapStyle=""
          hash
          getMapboxRef={getMapboxRef}
        />
        {popupVisible && selectedClimateData && datasetDescriptionResponse && (
          <FeaturePopup
            feature={feature}
            dataset={selectedClimateData}
            degreesOfWarming={degrees}
            onClose={closePopup}
            mapState={keplerGl[MAP_ID].mapState}
            datasetDescriptionResponse={datasetDescriptionResponse}
            tempUnit={tempUnit}
            onReadMoreClick={() => setShowDescriptionModal((show: boolean) => !show)}
            onBaselineClick={() => setShowDescriptionModal((show: boolean) => !show)}
            precipitationUnit={precipitationUnit}
          />
        )}
        {showMergeDataModal && (
          <MergeData createProject={createProject} onDatasetUploadFinish={onDatasetUploadFinish} />
        )}
        {location.pathname === "/map" && project.projectId && (
          <MapControls
            zoom={keplerGl[MAP_ID]?.mapState?.zoom}
            maxZoom={consts.MAX_ZOOM}
            minZoom={consts.MIN_ZOOM}
            onZoom={changeZoom}
            projectId={project.projectId}
            onScreenshot={takeScreenshot}
            onShareClick={onShareClick}
            onDownloadClick={onDownloadClick}
            onExportClick={onExportClick}
          />
        )}
        {showShareModal && project.projectId && (
          <ShareProject
            projectId={project.projectId}
            onModalClose={() => setShowShareModal(false)}
          />
        )}
        {showDownloadModal && project.projectId && (
          <DownloadProject
            projectId={project.projectId}
            onModalClose={() => setShowDownloadModal(false)}
          />
        )}
        {showImportReviewModal && importReviewProps && <ImportReview {...importReviewProps} />}
        <components.MapModal
          isVisible={showDescriptionModal}
          onToggle={() => setShowDescriptionModal((show: boolean) => !show)}
        >
          {datasetDescriptionResponse && (
            <components.MapDescription
              selectedDataset={selectedClimateData}
              datasetDescriptionResponse={datasetDescriptionResponse}
            />
          )}
        </components.MapModal>
        <components.MapModal
          isVisible={showBaselineModal}
          onToggle={() => setShowBaselineModal((show: boolean) => !show)}
        >
          <div
            style={{
              marginTop: "25px",
              padding: "0px 40px 15px",
            }}
          >
            <p
              dangerouslySetInnerHTML={{
                __html: warmingScenarioDescs.description_baseline_change_maps || "",
              }}
            ></p>
          </div>
        </components.MapModal>
        <ConfirmationModal
          isOpen={!!finalEnrichmentDataset}
          title="Enrichment complete"
          message={`Your data has been enriched with ${selectedClimateData?.name}. Would you like to reload to use your enriched data now?`}
          subTitle={finalEnrichmentDataset?.datasetName}
          confirmBtnText="Reload"
          dismissBtnText="Not now"
          onCancel={() => setFinalEnrichmentDataset(undefined)}
          onConfirm={reloadEnrichedDataset}
        />
        {isLaptop && renderSharedProjectHeader()}
        <components.Geocoder
          searchInputHeight={"35px"}
          serverErrorText="There was an error reaching the server"
          noResultText="No results found"
          placeholderText="Search for a location"
          clearText="clear"
          recentlySearchedText="recently searched"
          localStorageRecentlySearchedIemskey={consts.LOCAL_STORAGE_RECENTLY_SEARCHED_ITEMS_KEY}
          mapRef={mapRef}
          searchIsOpen={searchIsOpen}
          mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
          onFly={handleOnFly}
          setSearchIsOpen={setSearchIsOpen}
          top="120px"
          autoFocus
        />
        <components.AboutMap
          isOpen={showAboutMap}
          datasetDescriptionResponse={datasetDescriptionResponse}
          warmingScenarioDescs={warmingScenarioDescs}
          onClose={() => setShowAboutMap(false)}
          datasets={climateData}
          selectedDataset={selectedClimateData}
          onDatasetChange={onDatasetChange}
          aboutMapResources={aboutMapResources}
          source="pro"
        />
        {renderBottomLinks()}
      </Container>
    </>
  );
};

export default connector(InteractiveMap);
