import { Task } from "graphile-worker";
import QueryStream from "pg-query-stream";
import { PoolClient } from "pg";
import * as types from "../types";
import {
  createNearbyCoordinatesFile,
  updatePartnerDatasetUploadsWithCoordinates,
  selectPFGCMCoordinatesFromPartnerDatasetCoordinates,
  selectPFRCMCoordinatesFromPartnerDatasetCoordinates,
  updatePartnerDatasetCoordinatesWithPFRCMAndGCMCoordinates,
  createTempTable,
  selectCount,
  insertIntoTempTable,
} from "../services/partnerDatasets/nearbyCoordinates";
import { deleteUploadS3Object, updateUploadStatusToFailed } from "../services/partnerDatasets";
import { NearbyCoordinateResult, CoordinateGridModel } from "../types";
import { nearByCoordinatesBatchSize } from "../utils/constants";

type CoordinateResults = NearbyCoordinateResult & { row_id: string };

const streamCoordinatesIntoMap = (
  pgClient: PoolClient,
  query: string,
  grid: CoordinateGridModel,
  target: types.NearbyCoordinatesMap,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const stream = pgClient.query(new QueryStream(query));
    stream.on("data", (row: CoordinateResults) => {
      const { row_id, coordinate_hash, latitude, longitude } = row;
      const existing = target.get(row_id) ?? {};
      existing[grid] = { coordinate_hash, latitude, longitude };
      target.set(row_id, existing);
    });
    stream.on("end", () => resolve());
    stream.on("error", (err) => {
      stream.destroy();
      reject(err);
    });
  });

const addNearbyPFCoordinatesToPartnerDataset: Task = async (payload, { logger, withPgClient }) => {
  await withPgClient(async (pgClient) => {
    let newFile: string | undefined;
    const { partnerDatasetId, processedFileLocation, partnerId, uploadId } =
      payload as unknown as types.AddNearbyPFCoordinatesToPartnerDatasetPayload;
    try {
      await pgClient.query(createTempTable());
      await pgClient.query("CREATE INDEX ON pf_partner_dataset_coordinates_to_be_updated(id);");
      await pgClient.query("CREATE INDEX ON pf_partner_dataset_coordinates_to_be_updated(row_id);");
      await pgClient.query(insertIntoTempTable(partnerDatasetId));

      const { rows: totalCount } = await pgClient.query<{ count: number }>(
        selectCount(partnerDatasetId),
      );

      const batchCount = Math.ceil(totalCount[0].count / nearByCoordinatesBatchSize);
      for (let i = 0; i < batchCount; i++) {
        const startId = i * nearByCoordinatesBatchSize;
        const endId = (i + 1) * nearByCoordinatesBatchSize;
        await pgClient.query("BEGIN");
        try {
          await pgClient.query(
            updatePartnerDatasetCoordinatesWithPFRCMAndGCMCoordinates(startId, endId),
          );
          await pgClient.query("COMMIT");
        } catch (e: any) {
          await pgClient.query("ROLLBACK");
          logger.error("Failed to update partner_dataset_coordinates", e);
          throw e;
        }
      }

      await pgClient.query("drop table pf_partner_dataset_coordinates_to_be_updated;");

      // Stream RCM/GCM results directly into the map instead of materializing two full result
      // arrays before merging. Halves peak memory on large datasets.
      const nearbyRows: types.NearbyCoordinatesMap = new Map();
      await streamCoordinatesIntoMap(
        pgClient,
        selectPFRCMCoordinatesFromPartnerDatasetCoordinates(partnerDatasetId),
        "RCM",
        nearbyRows,
      );
      await streamCoordinatesIntoMap(
        pgClient,
        selectPFGCMCoordinatesFromPartnerDatasetCoordinates(partnerDatasetId),
        "GCM",
        nearbyRows,
      );

      // S3 I/O is intentionally outside any transaction so PG connections and locks aren't
      // held across slow uploads.
      const { nearbyCoordinateFileLocation, errors, rowCount } = await createNearbyCoordinatesFile({
        processedFileLocation,
        partnerDatasetId,
        partnerId,
        uploadId,
        pfCoordinates: nearbyRows,
        logger,
      });

      newFile = nearbyCoordinateFileLocation;
      logger.info("query time: %o", {
        id: partnerDatasetId,
        file: nearbyCoordinateFileLocation,
        rowCount,
        errors,
      });

      const nearbyProcessingErrors = {
        errors,
      };

      await pgClient.query("BEGIN");
      try {
        await pgClient.query(
          updatePartnerDatasetUploadsWithCoordinates({
            id: uploadId,
            file: nearbyCoordinateFileLocation,
            rowCount,
            errors: nearbyProcessingErrors,
            status: "successful",
          }),
        );
        await pgClient.query("COMMIT");
      } catch (e: any) {
        await pgClient.query("ROLLBACK");
        throw e;
      }
    } catch (e: any) {
      try {
        await pgClient.query(updateUploadStatusToFailed(uploadId));
      } catch (statusErr: any) {
        logger.error("Failed to mark upload as failed", statusErr);
      }
      if (newFile) {
        try {
          await deleteUploadS3Object(newFile);
        } catch (deleteErr: any) {
          logger.error("Failed to delete orphaned S3 object", deleteErr);
        }
      }
      logger.error("Failed to add coordinates to partner dataset", e);
      throw e;
    }
  });
};

export default addNearbyPFCoordinatesToPartnerDataset;
