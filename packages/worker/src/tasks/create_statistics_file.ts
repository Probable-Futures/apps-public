import { Task } from "graphile-worker";

import { extendDebugger } from "../utils/debugger";
import * as types from "../types";
import {
  createCountryStatisticsfile,
  selectDatasetStatisticsByCountry,
  streamCountryStatistics,
  updateDatasetStatisticsFileCreationFailed,
  updateDatasetStatisticsFileCreationInProgress,
  updateDatasetStatisticsFileCreationSuccessful,
} from "../services/createStatisticsFile";

const debug = extendDebugger("tasks:create_statistics_file");

type Country = {
  name: string;
  iso_a2: string;
  iso_a3: string;
  id: string;
};

const createStatisticsFile: Task = async (payload, { withPgClient, logger }) => {
  debug("start task: %o", payload);
  try {
    const { id, datasetId, countryId } = payload as types.CreateStatisticsFilePayload;
    const path = "climate-data/data-by-country";
    let country: Country | null = null;
    let pfMap = null;

    await withPgClient(async (pgClient) => {
      // Validate country and dataset
      try {
        if (!datasetId) {
          throw "datasetId is not valid";
        }
        if (!countryId) {
          throw "countryId is not valid";
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
        let countryResponse = await pgClient.query(
          "select * from pf_public.countries where id = $1",
          [countryId],
        );
        country = countryResponse.rows[0];
        if (!country) {
          await pgClient.query(updateDatasetStatisticsFileCreationFailed(id));
          throw "Country does not exist in the database";
        }
      } catch (error) {
        await pgClient.query(updateDatasetStatisticsFileCreationFailed(id));
        console.error(error);
        throw error;
      }
      await pgClient.query(updateDatasetStatisticsFileCreationInProgress(id));
      try {
        // Create a query stream that reads data from the db
        let queryStream = streamCountryStatistics(
          selectDatasetStatisticsByCountry(countryId, datasetId),
          pgClient,
        );
        // Create the statistics file and upload it to S3
        const { writeFileLocation } = await createCountryStatisticsfile({
          logger,
          queryStream,
          file: `${country.name.replace(/\s+/g, "_")}-${pfMap.name.replace(/\s+/g, "_")}.csv`, // replace empty space with underscors.
          path,
        });
        await pgClient.query(updateDatasetStatisticsFileCreationSuccessful(id, writeFileLocation));
      } catch (e: any) {
        logger.error("Failed to stream country statistics", e);
        await pgClient.query(updateDatasetStatisticsFileCreationFailed(id));
      }
    });
  } catch (e: any) {
    logger.error("Failed to create file!", e);
    throw e;
  }
};

export default createStatisticsFile;
