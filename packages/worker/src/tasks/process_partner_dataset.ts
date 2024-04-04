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
          await pgClient.query("ROLLBACK");
          await pgClient.query(updateUploadStatusToFailed(id));
          // TODO: Delete Uploaded File
          await deleteUploadS3Object(file);
          throw { e, processingErrors };
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
