import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";

import { enrichmentPollingInterval } from "../consts/dashboardConsts";
import { GET_DATASET_ENRICHMENT, START_ENRICHMENT } from "../graphql/queries/datasets";
import { useAppDispatch } from "../app/hooks";
import { SET_DATASET_ENRICHMENT } from "../store/actions";

type Props = {
  onEnrichmentFinish?: (datasetEnrichedNode: PartnerDatasetEnrichmentNode) => void;
};

type CreatePartnerDatasetEnrichment = {
  createPartnerDatasetEnrichment: {
    pfPartnerDatasetEnrichment: {
      id: string;
    };
  };
};

export type EnrichStatus = "requested" | "in progress" | "failed" | "successful";

export type PartnerDatasetEnrichmentNode = {
  id: string;
  status: EnrichStatus;
  enrichedDatasetFile: string;
  enrichmentErrors: any[];
  enrichedRowCount: number;
  pfDatasetId: number;
  projectId: string;
};

type PartnerDatasetEnrichment = {
  viewPartnerDatasetEnrichment: PartnerDatasetEnrichmentNode;
};

const useEnrichmentProcess = ({ onEnrichmentFinish }: Props) => {
  const [startEnrichment, { data: newErichmentData }] = useMutation(START_ENRICHMENT);
  const newEnrichedDataNode = (newErichmentData as CreatePartnerDatasetEnrichment) || undefined;
  const [processedWithCoodridatesRowCount, setProcessedWithCoodridatesRowCount] = useState(0);
  const [existingEnrichedDataNodeId, setExistingEnrichedDataNodeId] = useState("");
  const dispatch = useAppDispatch();

  const { stopPolling, startPolling } = useQuery<PartnerDatasetEnrichment>(GET_DATASET_ENRICHMENT, {
    variables: {
      id:
        newEnrichedDataNode?.createPartnerDatasetEnrichment?.pfPartnerDatasetEnrichment?.id ??
        existingEnrichedDataNodeId,
    },
    skip: !newEnrichedDataNode && !existingEnrichedDataNodeId,
    pollInterval: enrichmentPollingInterval,
    notifyOnNetworkStatusChange: true,
    onCompleted: (datasetEnrichment) => {
      const status = datasetEnrichment.viewPartnerDatasetEnrichment.status;
      if (status === "successful" || status === "failed") {
        stopPolling();
        if (onEnrichmentFinish) {
          onEnrichmentFinish(datasetEnrichment.viewPartnerDatasetEnrichment);
        }
        dispatch({
          type: SET_DATASET_ENRICHMENT,
          payload: {
            datasetEnrichment: {
              enrichmentProgress: 0,
              enrichmentStatus: status,
            },
          },
        });
      } else if (status === "in progress") {
        dispatch({
          type: SET_DATASET_ENRICHMENT,
          payload: { datasetEnrichment: { enrichmentStatus: status } },
        });
      }
    },
    onError: () => {
      stopPolling();
    },
  });

  const createEnrichedDataset = useCallback(
    (pfDatasetId: number, selectedPartnerDataset: string, uploadId: string, projectId: string) => {
      startEnrichment({
        variables: {
          partnerDatasetId: selectedPartnerDataset,
          uploadId,
          projectId,
          pfDatasetId,
        },
      });
      startPolling(enrichmentPollingInterval);
    },
    [startEnrichment, startPolling],
  );

  const triggerPollingOnExistingNode = useCallback(
    (enrichedId: string) => {
      setExistingEnrichedDataNodeId(enrichedId);
      startPolling(enrichmentPollingInterval);
    },
    [startPolling],
  );

  const getLoaderEnrichmentInfo = useCallback(() => {
    const loaderProcessingInfo = {
      text: "",
      time: processedWithCoodridatesRowCount / 50000 / 3,
    };
    if (processedWithCoodridatesRowCount < 10000) {
      loaderProcessingInfo.time = 0.5;
    } else if (
      processedWithCoodridatesRowCount >= 10000 &&
      processedWithCoodridatesRowCount <= 50000
    ) {
      loaderProcessingInfo.time = 1;
    }
    loaderProcessingInfo.text = `Your file will take about ${
      loaderProcessingInfo.time === 0.5
        ? "30 seconds"
        : Math.round(loaderProcessingInfo.time) + " minute(s)"
    } to load.`;

    return loaderProcessingInfo;
  }, [processedWithCoodridatesRowCount]);

  return {
    createEnrichedDataset,
    setProcessedWithCoodridatesRowCount,
    getLoaderEnrichmentInfo,
    triggerPollingOnExistingNode,
  };
};

export default useEnrichmentProcess;
