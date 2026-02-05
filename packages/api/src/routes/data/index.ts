import express, { Request, Response } from "express";
import AWS from "aws-sdk";
import { rootPgPool } from "../../database";

const router = express.Router();
const athena = new AWS.Athena({ region: 'us-west-2' });

const GRID = "RCM"
const S3_BUCKET = 'global-pf-data-engineering'
const S3_PATH_TO_ATHENA_RESULTS = "climate-data-full-model-raw-parquet/athena-results/"

const getRawData = async (req: Request, res: Response): Promise<void> => {
  const { longitude, latitude, variable, warmingScenario } = req.body;

  try {
    const hashResult = await rootPgPool.query(`
      SELECT gc.md5_hash, ST_X(gc.point::geometry) as lon, ST_Y(gc.point::geometry) as lat
      FROM pf_public.pf_grid_coordinates gc
      WHERE gc.grid = $1
      ORDER BY gc.point <-> ST_SetSRID(ST_MakePoint($2, $3), 4326)
      LIMIT 1
    `, [GRID, longitude, latitude]);

    if (hashResult.rows.length === 0) {
      res.status(404).json({ error: 'Location not found in grid' });
      return;
    }

    const { md5_hash: gridHash, lon, lat } = hashResult.rows[0];
    const hashPrefix = gridHash.substring(0, 2);

    const athenaQuery = `
      SELECT
        grid_hash,
        lon,
        lat,
        array_agg(value ORDER BY value) AS value_array
      FROM pf_climate_data.climate_raw_data
       WHERE variable = '${variable}'
        AND warming_scenario = '${warmingScenario}'
        AND hash_prefix = '${hashPrefix}'
        AND grid_hash = '${gridHash}'
      GROUP BY grid_hash, lon, lat;
    `;

    const queryParams = {
      QueryString: athenaQuery,
      ResultConfiguration: {
        OutputLocation: `s3://${S3_BUCKET}/${S3_PATH_TO_ATHENA_RESULTS}`
      },
      WorkGroup: 'primary'
    };

    const startResult = await athena.startQueryExecution(queryParams).promise();
    const queryExecutionId = startResult.QueryExecutionId;
    if (!queryExecutionId) {
      throw new Error('Failed to start Athena query');
    }

    let queryStatus: string | undefined = 'RUNNING' ;
    while (queryStatus === 'RUNNING' || queryStatus === 'QUEUED') {
      await new Promise(resolve => setTimeout(resolve, 500));

      const statusResult = await athena.getQueryExecution({
        QueryExecutionId: queryExecutionId
      }).promise();

      queryStatus = statusResult.QueryExecution?.Status?.State;

      if (queryStatus === 'FAILED' || queryStatus === 'CANCELLED') {
        throw new Error(`Athena query failed: ${statusResult.QueryExecution?.Status?.StateChangeReason}`);
      }
    }

    const resultsResult = await athena.getQueryResults({
      QueryExecutionId: queryExecutionId,
      MaxResults: 1000
    }).promise();

    const row = resultsResult?.ResultSet?.Rows?.[1];
    const dataPoints = row?.Data?.[3]?.VarCharValue;
    const dataPointsArray = dataPoints ? JSON.parse(dataPoints) : []

    res.json({
      location: { lon, lat },
      gridHash,
      variable,
      warmingScenario,
      dataPoints: dataPointsArray,
      count: dataPointsArray?.length || 0,
    });
  } catch (error) {
    console.error('Error querying climate data:', error);
    res.status(500).json({ error: 'Failed to retrieve climate data' });
  }
};

router.post("/raw", getRawData);

export default router;
