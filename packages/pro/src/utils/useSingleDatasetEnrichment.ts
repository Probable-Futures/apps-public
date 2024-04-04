import { useCallback, useEffect } from "react";

import { UploadResponse } from "../components/Dashboard/Project/MergeData";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import useEnrichmentProcess, { PartnerDatasetEnrichmentNode } from "./useEnrichmentProcess";
import { useMapData } from "../contexts/DataContext";
import useUploadProcess from "./useUploadProcess";
import { SET_DATASET_ENRICHMENT } from "../store/actions";

export type FinalEnrichmentDataset = {
  projectId: string;
  pfDatasetId: number;
  datasetName: string;
};

const useEnrichSingleDataset = ({
  onEnrichmentFinish,
}: {
  onEnrichmentFinish: (obj: FinalEnrichmentDataset) => void;
}) => {
  const datasetEnrichment = useAppSelector((state) => state.project.datasetEnrichment);

  const filteredProjectDatasets = useAppSelector((state) => state.project.filteredProjectDatasets);
  const projectDatasets = useAppSelector((state) => state.project.projectDatasets);
  const pfDatasetId = useAppSelector((state) => state.project.pfDatasetId);
  const projectId = useAppSelector((state) => state.project.projectId);
  const addedDataToMap = useAppSelector((state) => state.project.addedDataToMap);
  const dispatch = useAppDispatch();

  const { setImportReviewProps, setShowImportReviewModal } = useMapData();

  const enrichmentFinished = (datasetEnrichedNode: PartnerDatasetEnrichmentNode) => {
    if (datasetEnrichedNode.status === "successful") {
      const { index, pfDatasetId } = datasetEnrichment;
      if (index !== undefined && pfDatasetId) {
        const { datasetName } = filteredProjectDatasets[index];
        onEnrichmentFinish({ projectId: datasetEnrichedNode.projectId, pfDatasetId, datasetName });
      }
    }
  };

  const {
    createEnrichedDataset,
    setProcessedWithCoodridatesRowCount,
    triggerPollingOnExistingNode: startDatasetEnrichmentPolling,
  } = useEnrichmentProcess({ onEnrichmentFinish: enrichmentFinished });

  const onProcessFinished = useCallback(
    async (datasetUploadResponse: UploadResponse) => {
      if (projectId && pfDatasetId && datasetUploadResponse.datasetUploadNode) {
        const upload = datasetUploadResponse.datasetUploadNode;
        setShowImportReviewModal(true);
        setImportReviewProps({
          fileName: datasetUploadResponse.datasetUploadNode.id,
          successCount: upload.processedWithCoordinatesRowCount,
          errorsCount:
            (upload?.processingErrors?.invalid_rows.length || 0) +
            (upload?.processingErrors?.errors.length || 0) +
            (upload?.processingWithCoordinatesErrors?.errors.length || 0),
          typeOfErros: datasetUploadResponse?.errors.map((error) => error.message),
          onGoBack: () => {
            setShowImportReviewModal(false);
          },
          onComplete: () => {
            createEnrichedDataset(
              pfDatasetId,
              datasetUploadResponse.datasetUploadNode.partnerDatasetId,
              datasetUploadResponse.datasetUploadNode.id,
              projectId,
            );
            setShowImportReviewModal(false);
            setProcessedWithCoodridatesRowCount(upload.processedWithCoordinatesRowCount);
            dispatch({
              type: SET_DATASET_ENRICHMENT,
              payload: {
                datasetEnrichment: {
                  processedWithCoordinatesRowCount: upload.processedWithCoordinatesRowCount,
                  enrichmentStatus: "in progress",
                },
              },
            });
          },
          onClose: () => setShowImportReviewModal(false),
          getFileData: () =>
            upload?.processingErrors?.invalid_rows.map((invalidRow) => invalidRow.row.raw) || [],
        });
      }
    },
    [
      projectId,
      pfDatasetId,
      dispatch,
      createEnrichedDataset,
      setProcessedWithCoodridatesRowCount,
      setShowImportReviewModal,
      setImportReviewProps,
    ],
  );

  const { startUploadProcess, triggerPollingOnExistingNode: startDatasetUploadPolling } =
    useUploadProcess({
      onUploadFinish: onProcessFinished,
      geodataType: "latLon",
      process: true,
    });

  // this useEffect is triggered when enrich button is clicked.
  useEffect(() => {
    const { index, processingStatus, pfDatasetId, enrichmentStatus, forceNewEnrichment } =
      datasetEnrichment;
    if (
      index !== undefined &&
      processingStatus === "requested" &&
      enrichmentStatus === "requested"
    ) {
      const { datasetId, originalFile } = filteredProjectDatasets[index];
      const findProcessedFile = projectDatasets.find(
        (dataset) => dataset.datasetId === datasetId && dataset.processedWithCoordinatesFile,
      );
      // Do not proceed if dataset is already enriched
      const findEnrichedFile = projectDatasets.find(
        (dataset) =>
          dataset.datasetId === datasetId &&
          dataset.enrichedDatasetFile &&
          dataset.pfDatasetId === pfDatasetId,
      );
      if (findEnrichedFile && !forceNewEnrichment) {
        return;
      }
      if (findProcessedFile && pfDatasetId) {
        createEnrichedDataset(pfDatasetId, datasetId, findProcessedFile.uploadId, projectId);
        setProcessedWithCoodridatesRowCount(findProcessedFile.processedWithCoordinatesRowCount);
        dispatch({
          type: SET_DATASET_ENRICHMENT,
          payload: {
            datasetEnrichment: {
              processedWithCoordinatesRowCount: findProcessedFile.processedWithCoordinatesRowCount,
              enrichmentStatus: "in progress",
              processingStatus: findProcessedFile.processingStatus,
              forceNewEnrichment: false,
            },
          },
        });
      } else {
        startUploadProcess(originalFile, datasetId, true);
        dispatch({
          type: SET_DATASET_ENRICHMENT,
          payload: { datasetEnrichment: { processingStatus: "in progress" } },
        });
      }
    }
  }, [
    projectDatasets,
    projectId,
    filteredProjectDatasets,
    datasetEnrichment,
    startUploadProcess,
    dispatch,
    createEnrichedDataset,
    setProcessedWithCoodridatesRowCount,
  ]);

  // this useeffect is triggered when the project is initially loaded and one of the datasets is being processed
  useEffect(() => {
    const datasetIsInProgress = projectDatasets.find(
      (dataset) =>
        dataset.processingStatus === "in progress" || dataset.enrichmentStatus === "in progress",
    );

    if (datasetIsInProgress && addedDataToMap) {
      const index = filteredProjectDatasets.findIndex(
        (dataset) => dataset.datasetId === datasetIsInProgress.datasetId,
      );
      dispatch({
        type: SET_DATASET_ENRICHMENT,
        payload: {
          datasetEnrichment: {
            processingStatus: datasetIsInProgress.processingStatus,
            enrichmentStatus: datasetIsInProgress.enrichmentStatus,
            index: index,
            pfDatasetId: datasetIsInProgress.pfDatasetId,
            processedWithCoodridatesRowCount: datasetIsInProgress.processedWithCoordinatesRowCount,
            enrichmentProgress: 0,
          },
        },
      });
      if (datasetIsInProgress.processingStatus === "in progress") {
        startDatasetUploadPolling(datasetIsInProgress.uploadId);
      } else if (
        datasetIsInProgress.enrichmentStatus === "in progress" &&
        datasetIsInProgress.enrichedDatasetId
      ) {
        startDatasetEnrichmentPolling(datasetIsInProgress.enrichedDatasetId);
      }
    }
  }, [
    filteredProjectDatasets,
    addedDataToMap,
    projectDatasets,
    dispatch,
    startDatasetUploadPolling,
    startDatasetEnrichmentPolling,
  ]);
};

export default useEnrichSingleDataset;
