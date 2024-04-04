import { useEffect, useCallback, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";

import {
  CREATE_PARTNER_DATASET,
  CREATE_PARTNER_DATASET_UPLOAD,
  GET_PARTNER_DATASET_UPLOAD,
} from "../graphql/queries/datasets";
import { processPollingInterval } from "../consts/dashboardConsts";
import { UploadResponse } from "../components/Dashboard/Project/MergeData";
import { Geodata } from "../components/Dashboard/Project/MergeData";
import { urlDecode } from "../utils";
import {
  CreatePartnerDatasetUploadResponse,
  PartnerDatasetUpload,
  readUploadErrors,
} from "./DatasetUploadHelper";
import { useAppDispatch } from "../app/hooks";
import { SET_DATASET_ENRICHMENT } from "../store/actions";

type Props = {
  onUploadFinish: (uploadResponse: UploadResponse) => void;
  geodataType: Geodata;
  process: boolean;
};

const useUploadProcess = ({ onUploadFinish, geodataType, process }: Props) => {
  const [createPartnerDataset, { data: partnerDataset }] = useMutation(CREATE_PARTNER_DATASET);
  const [createPartnerDatasetUpload, { data: partnerDatasetUpload }] =
    useMutation<CreatePartnerDatasetUploadResponse>(CREATE_PARTNER_DATASET_UPLOAD);
  const [existingUploadDataNodeId, setExistingUploadDataNodeId] = useState("");

  const dispatch = useAppDispatch();

  const { stopPolling, startPolling } = useQuery<PartnerDatasetUpload>(GET_PARTNER_DATASET_UPLOAD, {
    variables: {
      id:
        partnerDatasetUpload?.createPartnerDatasetUpload?.pfPartnerDatasetUpload?.id ??
        existingUploadDataNodeId,
    },
    skip: (!partnerDatasetUpload || !process) && !existingUploadDataNodeId,
    pollInterval: processPollingInterval,
    notifyOnNetworkStatusChange: true,
    onCompleted: (datasetUpload) => {
      const uploadResult = datasetUpload.viewPartnerDatasetUpload;
      if (uploadResult.status === "successful" || uploadResult.status === "failed") {
        stopPolling();
        onUploadFinish({
          errors: readUploadErrors(uploadResult),
          datasetUploadNode: uploadResult,
        });
        dispatch({
          type: SET_DATASET_ENRICHMENT,
          payload: {
            datasetEnrichment: { enrichmentProgress: 0, processingStatus: uploadResult.status },
          },
        });
      } else if (uploadResult.status === "in progress") {
        dispatch({
          type: SET_DATASET_ENRICHMENT,
          payload: {
            datasetEnrichment: { processingStatus: uploadResult.status },
          },
        });
      }
    },
    onError: () => stopPolling(),
  });

  const startUploadProcess = useCallback(
    (uploadUrl: string, partnerDatasetId: string, enrich: boolean) => {
      createPartnerDatasetUpload({
        variables: {
          s3Url: urlDecode(uploadUrl),
          partnerDatasetId: partnerDatasetId,
          geodataType: geodataType,
          enrich,
        },
      });
    },
    [createPartnerDatasetUpload, geodataType],
  );

  const triggerPollingOnExistingNode = useCallback(
    (uploadId: string) => {
      setExistingUploadDataNodeId(uploadId);
      startPolling(processPollingInterval);
    },
    [startPolling],
  );

  useEffect(() => {
    if (partnerDatasetUpload && partnerDataset) {
      if (process) {
        startPolling(processPollingInterval);
      } else {
        onUploadFinish({
          errors: [],
          datasetUploadNode: partnerDatasetUpload.createPartnerDatasetUpload.pfPartnerDatasetUpload,
        });
        dispatch({
          type: SET_DATASET_ENRICHMENT,
          payload: {
            datasetEnrichment: {
              processingStatus:
                partnerDatasetUpload.createPartnerDatasetUpload.pfPartnerDatasetUpload.status,
            },
          },
        });
      }
    }
  }, [partnerDatasetUpload, partnerDataset, process, dispatch, onUploadFinish, startPolling]);

  return { createPartnerDataset, startUploadProcess, triggerPollingOnExistingNode };
};

export default useUploadProcess;
