import { Task } from "graphile-worker";

import * as types from "../types";
import {
  updateStatusToInProgress,
  updateStatusToFailed,
  updateStatusToSuccessful,
  createEnrichedFile,
  selectProcessedCoordinatesFile,
  selectEnrichmentData,
  streamEnrichmentData,
} from "../services/partnerDatasets/enrich";

const enrichmentTask: Task = async (payload, { withPgClient, logger }) => {
  const { id, pfDatasetId, partnerId, partnerDatasetId, uploadId } =
    payload as types.EnrichPartnerDatasetPayload;
  await withPgClient(async (pgClient) => {
    try {
      await pgClient.query(updateStatusToInProgress(id));

      const { rows } = await pgClient.query<{
        processed_with_coordinates_file: string;
      }>(selectProcessedCoordinatesFile(partnerDatasetId));

      if (!rows || !rows[0]) {
        throw Error("Processed file could not be found.");
      }

      const { processed_with_coordinates_file: processedWithCoordinatesFile } = rows[0];

      let enrichedCoordinates: types.EnrichedMap = {};
      try {
        enrichedCoordinates = await streamEnrichmentData(
          selectEnrichmentData({ pfDatasetId, partnerDatasetId }),
          pgClient,
        );
      } catch (e: any) {
        logger.error("Error while streaming the enrichment data", e);
        throw e;
      }

      const { rowCount, errors, file } = await createEnrichedFile({
        nearbyCoordinateFileLocation: processedWithCoordinatesFile,
        logger,
        pfDatasetId,
        partnerId,
        uploadId,
        partnerDatasetId,
        enrichedCoordinates,
      });

      await pgClient.query(updateStatusToSuccessful({ id, rowCount, file, errors }));
    } catch (e: any) {
      logger.error(e);
      await pgClient.query(updateStatusToFailed({ id, errors: [e] }));
      await pgClient.query("ROLLBACK");
      // TODO: Delete Uploaded File
      logger.error("Failed to enrich file", e);
      throw e;
    }
  });
};

export default enrichmentTask;
