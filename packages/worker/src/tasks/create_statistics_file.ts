import { Task } from "graphile-worker";

import { extendDebugger } from "../utils/debugger";
import * as types from "../types";
import {
  createGeoPlaceStatisticsfile,
  selectDatasetStatisticsByGeoPlace,
  streamGeoPlaceStatistics,
  updateDatasetStatisticsFileCreationFailed,
  updateDatasetStatisticsFileCreationInProgress,
  updateDatasetStatisticsFileCreationSuccessful,
} from "../services/createStatisticsFile";

const debug = extendDebugger("tasks:create_statistics_file");

type GeoPlace = {
  name: string;
  iso_a2: string;
  iso_a3: string;
  id: string;
  geo_place_type: string;
};

const createStatisticsFile: Task = async (payload, { withPgClient, logger }) => {
  debug("start task: %o", payload);
  try {
    const { id, datasetId, geoPlaceId } = payload as types.CreateStatisticsFilePayload;
    const path = "climate-data/data-by-place";
    let geoPlace: GeoPlace | null = null;
    let pfMap = null;

    await withPgClient(async (pgClient) => {
      // Validate place and dataset
      try {
        if (!datasetId) {
          throw "datasetId is not valid";
        }
        if (!geoPlaceId) {
          throw "geoPlaceId is not valid";
        }
        let pfMapResponse = null;
        pfMapResponse = await pgClient.query(
          "select * from pf_public.pf_maps where dataset_id = $1 limit 1",
          [datasetId],
        );
        pfMap = pfMapResponse.rows[0];
        if (!pfMap) {
          throw "Climate map does not exist";
        }
        let placeResponse = await pgClient.query(
          "select * from pf_public.geo_places where id = $1",
          [geoPlaceId],
        );
        geoPlace = placeResponse.rows[0];
        if (!geoPlace) {
          await pgClient.query(updateDatasetStatisticsFileCreationFailed(id));
          throw "geo Place does not exist in the database";
        }
      } catch (error) {
        await pgClient.query(updateDatasetStatisticsFileCreationFailed(id));
        console.error(error);
        throw error;
      }
      await pgClient.query(updateDatasetStatisticsFileCreationInProgress(id));
      try {
        // Create a query stream that reads data from the db
        let queryStream = streamGeoPlaceStatistics(
          selectDatasetStatisticsByGeoPlace(geoPlaceId, datasetId),
          pgClient,
        );
        // Create the statistics file and upload it to S3
        const { writeFileLocation } = await createGeoPlaceStatisticsfile({
          logger,
          queryStream,
          file: `${geoPlace.name.replace(/\s+/g, "_")}-${pfMap.name.replace(/\s+/g, "_")}.csv`, // replace empty space with underscors.
          path,
        });
        await pgClient.query(updateDatasetStatisticsFileCreationSuccessful(id, writeFileLocation));
      } catch (e: any) {
        logger.error("Failed to stream geoPlace statistics", e);
        await pgClient.query(updateDatasetStatisticsFileCreationFailed(id));
      }
    });
  } catch (e: any) {
    logger.error("Failed to create file!", e);
    throw e;
  }
};

export default createStatisticsFile;
