type StatisticsData = {
  datasetId: number;
  name: string;
  unit: string;
  warmingScenario: string;
  lowValue: string | number;
  midValue: string | number;
  highValue: string | number;
  longitude: number;
  latitude: number;
  info?: { [name: string]: any };
  map_category: string;
  x: number[];
  y: number[];
};

type StatisticsResponse = {
  data: {
    "@datasetStatisticsResponses": StatisticsData;
  }[];
};

const getClimateZonesLabels = async (pgClient: any) => {
  try {
    return pgClient.query(
      "select bin_labels from pf_public.pf_maps where dataset_id = 40901 and is_latest",
    );
  } catch (error) {
    throw error;
  }
};

/**
 * This function will be used to modify the statisticsResponse of the dataset_statistics query
 * by updating the info field. Currently it adds climate zone name to the response if
 * the map being queried is the climate zones map (dataset_id = 40901).
 * @param statisticsResponse
 * @returns statisticsResponse after updating the info field
 */
export const includeClimateZoneName = async (
  statisticsResponse: StatisticsResponse,
  pgClient: any,
) => {
  if (statisticsResponse?.data) {
    const climateZoneLabels = await getClimateZonesLabels(pgClient);
    const binLabels = climateZoneLabels?.rows[0]?.bin_labels as string[];
    statisticsResponse.data.map((statistics) => {
      const statisticsData = statistics["@datasetStatisticsResponses"];
      statisticsData.info = statisticsData.info || {};
      if (statisticsData.datasetId === 40901) {
        statisticsData.info["climateZoneName"] =
          binLabels[parseInt(statisticsData.midValue.toString()) - 1];
        return statistics;
      }
      return statistics;
    });
  }
  return statisticsResponse;
};
