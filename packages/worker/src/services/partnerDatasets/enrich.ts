import QueryStream from "pg-query-stream";
import { PoolClient } from "pg";
import format from "pg-format";

import * as types from "../../types";
import { EnrichedRow } from "../../models/partnerDatasets";
import { extendDebugger, extractNameAndPath } from "../../utils";
import { streamCsvDatasets } from "./stream";

const debug = extendDebugger("services:partnerDatasets:enrich");

export const updateStatusToInProgress = (id: string) =>
  format(
    "update pf_private.pf_partner_dataset_enrichments set status = 'in progress' where id = %L",
    id,
  );

export const updateStatusToSuccessful = ({
  id,
  file,
  rowCount = 0,
  errors,
}: {
  id: string;
  file: string;
  rowCount: number;
  errors: string[];
}) => {
  if (errors.length === 0) {
    return format(
      `update pf_private.pf_partner_dataset_enrichments
       set status = 'successful',
       enriched_dataset_file = %L,
       enriched_row_count = %L
       where id = %L`,
      file,
      rowCount,
      id,
    );
  }
  return format(
    `update pf_private.pf_partner_dataset_enrichments
       set status = 'successful',
       enriched_dataset_file = %L,
       enriched_row_count = %L,
       enrichment_errors = %L
       where id = %L`,
    file,
    rowCount,
    errors,
    id,
  );
};

export const updateStatusToFailed = ({ id, errors }: { id: string; errors: string[] }) =>
  format(
    "update pf_private.pf_partner_dataset_enrichments set status = 'failed', enrichment_errors = %L where id = %L",
    errors,
    id,
  );

export const selectProcessedCoordinatesFile = (id: string) =>
  format(
    "select processed_with_coordinates_file from pf_private.pf_partner_dataset_uploads where partner_dataset_id = %L and processed_with_coordinates_file is not null",
    id,
  );

export const selectEnrichmentData = ({
  pfDatasetId,
  partnerDatasetId,
}: {
  pfDatasetId: number;
  partnerDatasetId: string;
}) =>
  format(
    `with partner_dataset_coordinates as (
       select
         pf_rcm_coordinate_hash as pf_rcm_coordinate_hash,
         partner_dataset_row_id as row_id
       from pf_private.pf_partner_dataset_coordinates
       where partner_dataset_id = %L
     ) select
        pf.coordinate_hash as pf_rcm_coordinate_hash,
        pdc.row_id as row_id,
        pf.data_baseline_low,
        pf.data_baseline_mid,
        pf.data_baseline_high,
        pf.data_1c_low,
        pf.data_1c_mid,
        pf.data_1c_high,
        pf.data_1_5c_low,
        pf.data_1_5c_mid,
        pf.data_1_5c_high,
        pf.data_2c_low,
        pf.data_2c_mid,
        pf.data_2c_high,
        pf.data_2_5c_low,
        pf.data_2_5c_mid,
        pf.data_2_5c_high,
        pf.data_3c_low,
        pf.data_3c_mid,
        pf.data_3c_high
      from pf_private.aggregate_pf_dataset_statistics pf
      join partner_dataset_coordinates pdc
      on pf.coordinate_hash = pdc.pf_rcm_coordinate_hash
      where pf.dataset_id = %L`,
    partnerDatasetId,
    pfDatasetId,
  );

export const createEnrichedFile = async ({
  nearbyCoordinateFileLocation,
  partnerDatasetId,
  pfDatasetId,
  partnerId,
  uploadId,
  enrichedCoordinates,
  logger,
}: {
  nearbyCoordinateFileLocation: string;
  partnerDatasetId: string;
  pfDatasetId: number;
  partnerId: string;
  uploadId: string;
  enrichedCoordinates: types.EnrichedMap;
  logger: types.Logger;
}): Promise<{ rowCount: number; errors: any[]; file: string }> => {
  debug("createEnrichedFile");
  try {
    const { path: filePath } = extractNameAndPath(nearbyCoordinateFileLocation);

    const { rowCount, errors, writeFileLocation } = await streamCsvDatasets<
      types.RawCsvRow,
      EnrichedRow
    >({
      read: { file: filePath },
      write: {
        file: `${uploadId}.csv`,
        path: `${partnerId}/enriched/${pfDatasetId}`,
        httpUploadProgress: ({ loaded, total }) => {
          logger.debug(`Upload progress | Loaded: ${loaded} Total: ${total}`);
        },
      },
      parse: {
        transform: {
          row: (row: types.RawCsvRow) => {
            const enrichedRow = new EnrichedRow({
              raw: row,
              partnerDatasetId,
              pfDatasetId,
              logger,
            });

            const enrichedRowData = enrichedCoordinates[enrichedRow.id];
            if (enrichedRowData) {
              enrichedRow.addEnrichedData(enrichedRowData);
              delete enrichedCoordinates[enrichedRow.id];
            }
            return enrichedRow;
          },
          header: true,
        },
        validate: (row, cb) => {
          const { valid, reasons } = row.validate();
          return cb(null, valid, reasons.join(" "));
        },
        eventHandlers: {},
      },
    });

    return {
      rowCount,
      errors,
      file: writeFileLocation,
    };
  } catch (error) {
    logger.error("Error enriching partner dataset.", {
      nearbyCoordinateFileLocation,
      partnerDatasetId,
      pfDatasetId,
      error,
    });
    throw error;
  }
};

export const streamEnrichmentData = (
  query: string,
  pgClient: PoolClient,
): Promise<types.EnrichedMap> => {
  const queryStream = new QueryStream(query);
  const enrichedCoordinates: types.EnrichedMap = {};

  const stream = pgClient.query(queryStream);
  return new Promise((resolve, reject) => {
    stream.on("data", (data: any) => {
      enrichedCoordinates[data["row_id"]] = {
        row_id: data["row_id"],
        pf_rcm_coordinate_hash: data["pf_rcm_coordinate_hash"],
        data: [
          data["data_baseline_low"],
          data["data_baseline_mid"],
          data["data_baseline_high"],
          data["data_1c_low"],
          data["data_1c_mid"],
          data["data_1c_high"],
          data["data_1_5c_low"],
          data["data_1_5c_mid"],
          data["data_1_5c_high"],
          data["data_2c_low"],
          data["data_2c_mid"],
          data["data_2c_high"],
          data["data_2_5c_low"],
          data["data_2_5c_mid"],
          data["data_2_5c_high"],
          data["data_3c_low"],
          data["data_3c_mid"],
          data["data_3c_high"],
        ],
      };
      stream.on("end", () => {
        resolve(enrichedCoordinates);
      });
      stream.on("error", reject);
    });
  });
};
