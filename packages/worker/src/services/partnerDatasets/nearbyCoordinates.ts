import format from "pg-format";
import * as types from "../../types";
import { NearbyPFCoordinatesRow } from "../../models/partnerDatasets";
import { extendDebugger, extractNameAndPath } from "../../utils";
import { streamCsvDatasets } from "./stream";

const debug = extendDebugger("services:partnerDatasets:nearbyCoordinates");

export const updateUploadStatusToInProgress = (id: string) =>
  format(
    "update pf_private.pf_partner_dataset_uploads set status = 'in progress' where id = %L",
    id,
  );

export const updateUploadStatusToFailed = (id: string) =>
  format("update pf_private.pf_partner_dataset_uploads set status = 'failed' where id = %L", id);

export const selectPFRCMCoordinatesFromPartnerDatasetCoordinates = (id: string) =>
  format(
    `select pdc.pf_rcm_coordinate_hash as coordinate_hash,
       pdc.partner_dataset_row_id as row_id,
       ST_X(gc.point::geometry) as longitude,
       ST_Y(gc.point::geometry) as latitude
     from pf_private.pf_partner_dataset_coordinates as pdc
     join pf_public.pf_grid_coordinates gc
    on pdc.pf_rcm_coordinate_hash = gc.md5_hash
     where pdc.partner_dataset_id = %L and gc.grid = 'RCM'`,
    id,
  );

export const selectPFGCMCoordinatesFromPartnerDatasetCoordinates = (id: string) =>
  format(
    `select pdc.pf_gcm_coordinate_hash as coordinate_hash,
       pdc.partner_dataset_row_id as row_id,
       ST_X(gc.point::geometry) as longitude,
       ST_Y(gc.point::geometry) as latitude
     from pf_private.pf_partner_dataset_coordinates as pdc
     join pf_public.pf_grid_coordinates gc
    on pdc.pf_gcm_coordinate_hash = gc.md5_hash
     where pdc.partner_dataset_id = %L and gc.grid = 'GCM'`,
    id,
  );

export const updatePartnerDatasetCoordinatesWithPFRCMAndGCMCoordinates = (
  startId: number,
  endId: number,
) =>
  format(
    `update pf_private.pf_partner_dataset_coordinates as pdc
      set pf_rcm_coordinate_hash = (
        select gc.md5_hash
        from pf_public.pf_grid_coordinates as gc
        where gc.grid = 'RCM'
        order by gc.point <-> pdc.coordinates
        limit 1
      ), 
      pf_gcm_coordinate_hash = (
        select gc.md5_hash
        from pf_public.pf_grid_coordinates as gc
        where gc.grid = 'GCM'
        order by gc.point <-> pdc.coordinates
        limit 1
      ) 
      from pf_partner_dataset_coordinates_to_be_updated tbu
        where tbu.id = pdc.id
        and tbu.row_id > ${startId} and tbu.row_id <= ${endId};
      `,
  );

export const createTempTable = () =>
  format(
    `create temp table if not exists pf_partner_dataset_coordinates_to_be_updated (
      id uuid not null,
      row_id integer not null
    );`,
  );

export const insertIntoTempTable = (id: string) =>
  format(
    `insert into pf_partner_dataset_coordinates_to_be_updated 
      select id, ROW_NUMBER() OVER(order by (select 1)) row_id
      from pf_private.pf_partner_dataset_coordinates as pdc
      where pdc.partner_dataset_id = %L`,
    id,
  );

export const selectCount = (id: string) =>
  format(
    `select count(*) from pf_private.pf_partner_dataset_coordinates where partner_dataset_id = %L;`,
    id,
  );

export const updatePartnerDatasetUploadsWithCoordinates = ({
  id,
  file,
  rowCount,
  errors,
  status,
}: {
  id: string;
  file: string;
  rowCount: number;
  errors: { errors: string[] };
  status: string;
}) =>
  format(
    `update pf_private.pf_partner_dataset_uploads
      set processed_with_coordinates_file = %L,
      processed_with_coordinates_row_count = %L,
      processing_with_coordinates_errors = %L,
      status = %L
      where id = %L`,
    file,
    rowCount,
    errors,
    status,
    id,
  );

export const createNearbyCoordinatesFile = async ({
  processedFileLocation,
  partnerDatasetId,
  uploadId,
  partnerId,
  logger,
  pfCoordinates,
}: {
  processedFileLocation: string;
  uploadId: string;
  partnerId: string;
  partnerDatasetId: string;
  pfCoordinates: types.NearbyCoordinatesMap;
  logger: types.Logger;
}) => {
  debug("createNearbyCoordinatesFile");
  try {
    const { path: filePath } = extractNameAndPath(processedFileLocation);

    const { rowCount, errors, writeFileLocation } = await streamCsvDatasets<
      types.RawCsvRow,
      NearbyPFCoordinatesRow
    >({
      read: { file: filePath },
      write: {
        file: `${uploadId}.csv`,
        path: `${partnerId}/nearby-coordinates`,
        httpUploadProgress: ({ loaded, total }) => {
          logger.debug(`Upload progress | Loaded: ${loaded} Total: ${total}`);
        },
      },
      parse: {
        transform: {
          header: true,
          row: (row: types.RawCsvRow): NearbyPFCoordinatesRow => {
            const nearbyCoordinatesRow = new NearbyPFCoordinatesRow({
              partnerDatasetId,
              raw: row,
              logger,
            });
            const nearbyCoordinateResult = pfCoordinates.get(nearbyCoordinatesRow.id);
            if (nearbyCoordinateResult) {
              nearbyCoordinatesRow.setNearbyPFCoordinates(nearbyCoordinateResult);
            }
            return nearbyCoordinatesRow;
          },
        },
        validate: (row, cb) => {
          const { valid, reasons } = row.validate();
          return cb(null, valid, reasons.join(" "));
        },
        eventHandlers: {},
      },
    });

    return {
      nearbyCoordinateFileLocation: writeFileLocation,
      rowCount,
      errors,
    };
  } catch (error) {
    logger.error("Error adding coordinates to partner dataset.", {
      processedFileLocation,
      partnerDatasetId,
      error,
    });
    throw error;
  }
};
