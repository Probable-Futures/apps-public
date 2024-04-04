import { PoolClient } from "pg";
import format from "pg-format";
import QueryStream from "pg-query-stream";
import * as csv from "fast-csv";

import * as aws from "../aws";
import { env, extendDebugger } from "../../utils";
import * as types from "../../types";

const debug = extendDebugger("services:createStatisticsFile:index");

export const streamCountryStatistics = (query: string, pgClient: PoolClient): QueryStream => {
  const queryStream = new QueryStream(query);
  return pgClient.query(queryStream);
};

export const selectDatasetStatisticsByCountry = (countryId: string, datasetId: number) =>
  format(
    `with country as (
      select ST_Transform(wkb_geometry, 4326)::geography as boundary from pf_public.countries where id = %L
    )
    select * from (
      select (ST_X(gc.point::geometry)) as longitude,
        (ST_Y(gc.point::geometry)) as latitude,
        (ST_AsGeoJSON(gc.cell::geometry, 1)::json)->'coordinates' as cell,
        stats.data_baseline_low as low_value_0_5C,
        stats.data_baseline_mid as mid_value_0_5C,
        stats.data_baseline_high as high_value_0_5C,
        stats.data_1c_low as low_value_1C,
        stats.data_1c_mid as mid_value_1C,
        stats.data_1c_high as high_value_1C,
        stats.data_1_5c_low as low_value_1_5C,
        stats.data_1_5c_mid as mid_value_1_5C,
        stats.data_1_5c_high as high_value_1_5C,
        stats.data_2c_low as low_value_2C,
        stats.data_2c_mid as mid_value_2C,
        stats.data_2c_high as high_value_2C,
        stats.data_2_5c_low as low_value_2_5C,
        stats.data_2_5c_mid as mid_value_2_5C,
        stats.data_2_5c_high as high_value_2_5C,
        stats.data_3c_low as low_value_3C,
        stats.data_3c_mid as mid_value_3C,
        stats.data_3c_high as high_value_3C
        from pf_private.aggregate_pf_dataset_statistics stats
        join pf_public.pf_grid_coordinates gc on stats.coordinate_hash = gc.md5_hash
        where stats.dataset_id = %L and st_intersects((select boundary from country), gc.cell)) as t
      order by t.longitude, t.latitude;`,
    countryId,
    datasetId,
  );

export const updateDatasetStatisticsFileCreationInProgress = (id: string) =>
  format("update pf_private.pf_country_statistics set status = 'in progress' where id = %L", id);

export const updateDatasetStatisticsFileCreationFailed = (id: string) =>
  format("update pf_private.pf_country_statistics set status = 'failed' where id = %L", id);

export const updateDatasetStatisticsFileCreationSuccessful = (id: string, fileUrl: string) =>
  format(
    "update pf_private.pf_country_statistics set status = 'successful', file_url = %L where id = %L",
    fileUrl,
    id,
  );

const pathPrefix = env.isLocal && env.isDev ? "local-development/" : "";
type WriteStreamArgs = { path: string; file: string };
const writeDatasetStream = ({ path, file }: WriteStreamArgs) => {
  debug("writeDatasetStream");
  try {
    const { writeStream, uploadManager } = aws.s3.writeObjectStream({
      Bucket: env.AWS_S3_BUCKET,
      Key: `${pathPrefix}${path}/${file}`,
      ACL: "private",
      ContentType: "text/csv",
    });
    return { writeStream, uploadManager };
  } catch (err) {
    console.error("Failed to open write stream to path: %s file: %s", path, file);
    console.error(err);
    throw err;
  }
};

export const createCountryStatisticsfile = async ({
  file,
  path,
  logger,
  queryStream,
}: {
  queryStream: QueryStream;
  file: string;
  path: string;
  logger: types.Logger;
}): Promise<{ writeFileLocation: string }> => {
  debug("createCountryStatisticsfile");
  try {
    let writeFileLocation = "";
    return new Promise((resolve, reject) => {
      const { writeStream, uploadManager } = writeDatasetStream({
        file,
        path,
      });

      uploadManager.send((error, data) => {
        debug("streamCsvDatasets: uploadManager");
        if (error) {
          console.error("uploadManager Error: %o", error);
          reject(error);
        } else {
          debug("streamCsvDatasets: uploadManager success");
          writeFileLocation = data.Location;
          resolve({ writeFileLocation });
        }
      });

      uploadManager.on("httpUploadProgress", ({ loaded, total }) => {
        logger.debug(`Upload progress | Loaded: ${loaded} Total: ${total}`);
      });
      const csvStream = csv.format({ headers: true });

      queryStream
        .pipe(csvStream)
        .pipe(writeStream)
        .on("error", (err: any) => {
          debug("formatCsvDatasets: error %o", err);
          reject(err);
        })
        .on("finish", () => {
          debug("formatCsvDatasets: success");
        });
    });
  } catch (error) {
    logger.error("Creating statistics file failed.", {});
    throw error;
  }
};
