import { Task } from "graphile-worker";

import { extendDebugger } from "../utils/debugger";
import {
  createProcessedFile,
  updatePartnerDatasetUploads,
} from "../services/partnerDatasets/process";
import {
  deleteUploadS3Object,
  updateUploadStatusToFailed,
  updateUploadStatusToInProgress,
} from "../services/partnerDatasets";
import * as types from "../types";

const debug = extendDebugger("tasks:process_partner_dataset");

const processPartnerDataset: Task = async (payload, { withPgClient, logger, addJob }) => {
  debug("start task: %o", payload);
  try {
    const { id, originalFile, partnerDatasetId, partnerId, geodataType } =
      payload as types.ProcessParterDatasetPayload;

    await withPgClient(async (pgClient) => {
      await pgClient.query(updateUploadStatusToInProgress(id));
      try {
        const { headers, rowCount, file, coordinates, invalidRows, errors } =
          await createProcessedFile({
            id,
            partnerDatasetId,
            originalFile,
            logger,
            partnerId,
            pgClient,
            geodataType,
          });

        debug("processing complete: %o", {
          headers,
          rowCount,
          file,
          coordinates,
          invalidRows,
          errors,
        });
        const processingErrors = {
          invalid_rows: invalidRows.slice(0, 500),
          errors,
        };

        try {
          debug("saving dataset to db");
          await pgClient.query("BEGIN");
          debug("updating partner dataset upload...");
          await pgClient.query(
            updatePartnerDatasetUploads({
              file,
              rowCount,
              headers,
              errors: processingErrors,
              id,
            }),
          );
          await pgClient.query("COMMIT");

          debug("data commited to db");
          await addJob("add_nearby_pf_coordinates_to_partner_dataset", {
            partnerDatasetId,
            partnerId,
            uploadId: id,
            processedFileLocation: file,
          });

          debug("job added");
        } catch (e: any) {
          debug("db error");
          try {
            await pgClient.query("ROLLBACK");
          } catch (rollbackErr: any) {
            logger.error("Failed to ROLLBACK after processed dataset save error", rollbackErr);
          }
          try {
            await pgClient.query(updateUploadStatusToFailed(id));
          } catch (statusErr: any) {
            logger.error("Failed to mark upload as failed", statusErr);
          }
          try {
            await deleteUploadS3Object(file);
          } catch (deleteErr: any) {
            logger.error("Failed to delete orphaned S3 object", deleteErr);
          }
          logger.error("Failed to save processed partner dataset", { processingErrors, error: e });
          throw e;
        }
      } catch (e: any) {
        logger.error("Failed to created processed file", e);
        await pgClient.query(updateUploadStatusToFailed(id));
        throw e;
      }
    });
  } catch (e: any) {
    logger.error("Failed to process partner dataset", e);
    throw e;
  }
};

export default processPartnerDataset;
