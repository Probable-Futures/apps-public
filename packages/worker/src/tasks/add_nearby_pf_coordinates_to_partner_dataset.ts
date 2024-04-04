import { Task } from "graphile-worker";
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
import { NearbyCoordinateResult } from "../types";
import { nearByCoordinatesBatchSize } from "../utils/constants";

type CoordinateResults = NearbyCoordinateResult & { row_id: string };

const addNearbyPFCoordinatesToPartnerDataset: Task = async (payload, { logger, withPgClient }) => {
  await withPgClient(async (pgClient) => {
    let newFile: string;
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

      for (let i = 0; i < totalCount[0].count / nearByCoordinatesBatchSize; i++) {
        const startId = i * nearByCoordinatesBatchSize;
        const endId = (i + 1) * nearByCoordinatesBatchSize;
        try {
          await pgClient.query("BEGIN");
          await pgClient.query(
            updatePartnerDatasetCoordinatesWithPFRCMAndGCMCoordinates(startId, endId),
          );
          await pgClient.query("COMMIT");
        } catch (e: any) {
          logger.error("Failed to update partner_dataset_coordinates", e);
          throw e;
        }
      }

      await pgClient.query("drop table pf_partner_dataset_coordinates_to_be_updated;");
      await pgClient.query("BEGIN");

      const { rows: rcmRows, rowCount: rcmRowCount } = await pgClient.query<CoordinateResults>(
        selectPFRCMCoordinatesFromPartnerDatasetCoordinates(partnerDatasetId),
      );

      const { rows: gcmRows, rowCount: gcmRowCount } = await pgClient.query<CoordinateResults>(
        selectPFGCMCoordinatesFromPartnerDatasetCoordinates(partnerDatasetId),
      );

      const nearbyRows: types.NearbyCoordinatesMap = new Map();

      rcmRows.forEach(({ row_id, coordinate_hash, latitude, longitude }) => {
        // @ts-ignore
        nearbyRows.set(row_id, { RCM: { coordinate_hash, latitude, longitude } });
      });

      gcmRows.forEach(({ row_id, coordinate_hash, latitude, longitude }) => {
        const rowData = nearbyRows.get(row_id);
        if (rowData) {
          rowData["GCM"] = { coordinate_hash, latitude, longitude };
          nearbyRows.set(row_id, rowData);
        } else {
          // @ts-ignore
          nearbyRows.set(row_id, { GCM: { coordinate_hash, latitude, longitude } });
        }
      });

      rcmRows.length = 0;
      gcmRows.length = 0;

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

      await pgClient.query(
        updatePartnerDatasetUploadsWithCoordinates({
          id: uploadId,
          file: nearbyCoordinateFileLocation,
          rowCount,
          errors: nearbyProcessingErrors,
          status: "successful",
        }),
      );

      logger.info("commit time");
      await pgClient.query("COMMIT");
      logger.info("post commit ");
    } catch (e: any) {
      await pgClient.query("ROLLBACK");
      await pgClient.query(updateUploadStatusToFailed(uploadId));
      //@ts-ignore
      if (newFile) {
        await deleteUploadS3Object(newFile);
      }
      logger.error("Failed to add coordinates to partner dataset", e);
      throw e;
    }
  });
};

export default addNearbyPFCoordinatesToPartnerDataset;
