import * as csv from "fast-csv";
import * as util from "util";
import format from "pg-format";
import { extendDebugger, extractNameAndPath } from "../../utils";
import * as types from "../../types";
import { ParsedRow, ProcessedRow } from "../../models/partnerDatasets";
import { streamCsvDatasets } from "./stream";
import { PoolClient } from "pg";
import { processingInsertBatchSize } from "../../utils/constants";

const debug = extendDebugger("services:partner:datasets:process");

export const insertPartnerDatasetCoordinates = (values: types.PartnerDatasetCoordinates[]) =>
  format(
    `insert into pf_private.pf_partner_dataset_coordinates (
  partner_dataset_id,
  partner_dataset_row_id,
  coordinates) values %L`,
    values,
  );

export const updatePartnerDatasetUploads = ({
  file,
  rowCount,
  headers,
  errors,
  id,
}: {
  file: string;
  rowCount: number;
  headers: csv.ParserHeaderArray;
  errors: { invalid_rows: types.InvalidRow<any>[]; errors: any[] };
  id: string;
}) =>
  format(
    `update pf_private.pf_partner_dataset_uploads
  set processed_file = %L,
  processed_row_count = %L,
  csv_headers = ARRAY[%L],
  processing_errors = %L
  where id = %L`,
    file,
    rowCount,
    headers,
    errors,
    id,
  );

const insertCoordinatesBatch = async (
  coordinates: types.PartnerDatasetCoordinates[],
  pgClient: PoolClient,
) => {
  debug("saving partner dataset coordinates...");
  await pgClient.query(insertPartnerDatasetCoordinates(coordinates));
};

export const createProcessedFile = async ({
  id: uploadId,
  partnerDatasetId,
  partnerId,
  originalFile,
  logger,
  pgClient,
  geodataType,
}: types.ProcessParterDatasetPayload & { logger: types.Logger; pgClient: PoolClient }): Promise<{
  coordinates: types.PartnerDatasetCoordinates[];
  rowCount: number;
  invalidRows: types.InvalidRow<types.RawRow>[];
  headers: csv.ParserHeaderArray;
  file: string;
  errors: any[];
}> => {
  debug("preProcessPartnerDataset");
  try {
    let coordinates: types.PartnerDatasetCoordinates[] = [];
    const { path: filePath } = extractNameAndPath(originalFile);

    const { rowCount, invalidRows, headers, errors, writeFileLocation } = await streamCsvDatasets<
      types.RawCsvRow,
      ProcessedRow
    >({
      read: { file: filePath },
      write: {
        file: `${uploadId}.csv`,
        path: `${partnerId}/processed`,
        httpUploadProgress: ({ loaded, total }) => {
          logger.debug(`Upload progress | Loaded: ${loaded} Total: ${total}`);
        },
      },
      parse: {
        transform: {
          header: (heads: csv.ParserHeaderArray) =>
            heads.map((h) => h?.toLowerCase().trim().replace(/ /g, "_")),
          row: util.callbackify(async (row: types.RawCsvRow): Promise<ProcessedRow> => {
            const parsedRow = new ParsedRow({ raw: row, partnerDatasetId, logger, geodataType });
            const processedRow = await parsedRow.process();
            return processedRow;
          }),
        },
        validate: async (row, cb) => {
          const { valid, reasons } = row.validate();
          if (valid) {
            const coordinateValues = row.getDatasetCoordinateValues();
            coordinates.push(coordinateValues);
          }
          if (coordinates.length >= processingInsertBatchSize) {
            try {
              await pgClient.query("BEGIN");
              await insertCoordinatesBatch(coordinates, pgClient);
              await pgClient.query("COMMIT");
            } catch (e) {
              debug("db error");
              const failedRowIds = coordinates.map((c) => c[1]);
              reasons.push(
                `Error saving partner coordinates to database. ${failedRowIds.join(",")}`,
              );
            }
            coordinates = [];
          }
          return cb(null, valid, reasons.join(" "));
        },
        eventHandlers: {
          data: async (row) => {},
          end: async () => {
            if (coordinates.length > 0) {
              try {
                await pgClient.query("BEGIN");
                await insertCoordinatesBatch(coordinates, pgClient);
                await pgClient.query("COMMIT");
              } catch (e) {
                debug("db error");
              }
              coordinates = [];
            }
          },
        },
      },
    });

    return {
      coordinates,
      rowCount,
      headers,
      file: writeFileLocation,
      errors,
      invalidRows,
    };
  } catch (error) {
    logger.error("Error processing partner dataset.", {
      uploadId,
      partnerDatasetId,
      originalFile,
      error,
    });
    throw error;
  }
};
