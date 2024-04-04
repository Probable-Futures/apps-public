import { useCallback, useState } from "react";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { SET_DATASET_ENRICHMENT } from "../store/actions";
import useProjectInit from "./useProjectInit";
import { MAP_ID } from "../consts/MapConsts";
import { useMapData } from "../contexts/DataContext";

const useEnrich = () => {
  const project = useAppSelector((state) => state.project);
  const layers = useAppSelector((state) => state.keplerGl[MAP_ID]?.visState?.layers);
  const datasets = useAppSelector((state) => state.keplerGl[MAP_ID]?.visState?.datasets);
  const [datasetEnrichmentInfo, setDatasetEnrichmentInfo] = useState<{
    dataId: string;
    index: number;
    forceNewEnrichment?: boolean;
  }>();
  const { callInit } = useProjectInit();
  const dispatch = useAppDispatch();
  const { selectedClimateData: activeClimateDataset } = useMapData();

  const enrichmentMessage = activeClimateDataset
    ? `<p>Enriching is the process of combining an uploaded dataset with Probable Futures climate data, allowing for full filtering functionality.<p><p>You are about to enrich with <b>${activeClimateDataset?.name}</b>. This typically takes few minutes depending on the file size. Would you like to continue?</p>`
    : "";

  const enrichmentSubTitle =
    project.filteredProjectDatasets && datasetEnrichmentInfo
      ? project.filteredProjectDatasets[datasetEnrichmentInfo.index].datasetName
      : "";

  const showEnrich = useCallback(
    (index: number) => {
      const { datasetId, originalFile } = project.filteredProjectDatasets[index];
      const layer = layers.find(
        (layer: any) => layer.config.dataId === Object.keys(datasets)[index],
      );

      const datasetEnrichment = project.datasetEnrichment;
      if (
        datasetEnrichment?.enrichmentStatus === "in progress" ||
        datasetEnrichment.processingStatus === "in progress" ||
        layer?.type === "geojson" ||
        originalFile.endsWith(".json")
      ) {
        return false;
      }
      if (datasetId) {
        return (
          project.projectDatasets.findIndex(
            (dataset) =>
              dataset.datasetId === datasetId &&
              dataset.pfDatasetId === project.pfDatasetId &&
              dataset.enrichedDatasetFile,
          ) === -1
        );
      }
      return false;
    },
    [
      project.projectDatasets,
      project.filteredProjectDatasets,
      project.pfDatasetId,
      project.datasetEnrichment,
      layers,
      datasets,
    ],
  );

  const showReload = useCallback(
    (index: number) => {
      const datasetEnrichment = project.datasetEnrichment;
      if (
        datasetEnrichment?.index === index &&
        datasetEnrichment.processingStatus !== "in progress" &&
        datasetEnrichment.enrichmentStatus !== "in progress" &&
        datasetEnrichment.pfDatasetId === project.pfDatasetId
      ) {
        return true;
      } else {
        const currentDataset = project.filteredProjectDatasets[index];
        if (
          currentDataset.enrich &&
          currentDataset.pfDatasetId === project.pfDatasetId &&
          currentDataset.enrichedDatasetFile
        ) {
          return false;
        }
        const enrichedDatasetWithSelectedClimateData = project.projectDatasets.find(
          (projectDataset) =>
            projectDataset.pfDatasetId === project.pfDatasetId &&
            projectDataset.enrichedDatasetFile &&
            projectDataset.datasetId === currentDataset.datasetId,
        );

        if (enrichedDatasetWithSelectedClimateData) {
          return true;
        }
      }
      return false;
    },
    [
      project.datasetEnrichment,
      project.projectDatasets,
      project.filteredProjectDatasets,
      project.pfDatasetId,
    ],
  );

  const showLoading = useCallback(
    (index: number) => {
      const datasetEnrichment = project.datasetEnrichment;

      return (
        datasetEnrichment.index === index &&
        (datasetEnrichment.processingStatus === "in progress" ||
          datasetEnrichment.enrichmentStatus === "in progress")
      );
    },
    [project.datasetEnrichment],
  );

  const onEnrichClick = (index: number, dataId: string, forceNewEnrichment?: boolean) => {
    setDatasetEnrichmentInfo({ index, dataId, forceNewEnrichment });
  };

  const onReloadClick = () => {
    if (project.projectId && project.pfDatasetId) {
      callInit(project.projectId, project.pfDatasetId, false);
    }
  };

  const onConfrimEnrich = useCallback(() => {
    if (datasetEnrichmentInfo) {
      dispatch({
        type: SET_DATASET_ENRICHMENT,
        payload: {
          datasetEnrichment: {
            dataId: datasetEnrichmentInfo.dataId,
            index: datasetEnrichmentInfo.index,
            processingStatus: "requested",
            enrichmentStatus: "requested",
            pfDatasetId: project.pfDatasetId,
            forceNewEnrichment: datasetEnrichmentInfo.forceNewEnrichment,
          },
        },
      });
      setDatasetEnrichmentInfo(undefined);
    }
  }, [datasetEnrichmentInfo, project.pfDatasetId, setDatasetEnrichmentInfo, dispatch]);

  return {
    datasetEnrichmentInfo,
    enrichmentMessage,
    enrichmentSubTitle,
    showReload,
    showEnrich,
    showLoading,
    onReloadClick,
    onEnrichClick,
    setDatasetEnrichmentInfo,
    onConfrimEnrich,
  };
};

export default useEnrich;
