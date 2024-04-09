import { consts, types, utils } from "@probable-futures/lib";
import { DatasetDescriptionResponse } from "@probable-futures/lib/src/types";
import { climateZonesDescriptions } from "./consts";
import { datasets } from "./consts/datasets";

export type ExportProps = {
  datasetId?: number;
  dataset?: types.Map;
  tempUnit?: "°C" | "°F";
  scenario?: number;
  viewState: Partial<{ longitude: number; latitude: number; zoom: number }>;
  compare?: {
    scenarioBefore: number;
    scenarioAfter: number;
  };
  datasetDescriptionResponse?: DatasetDescriptionResponse;
  precipitationUnit?: types.PrecipitationUnit;
};

const embedAccessToken =
  "pk.eyJ1IjoicHJvYmFibGVmdXR1cmVzIiwiYSI6ImNsaThxcXF1YjA5ajgzZHBnemJtNGptMnAifQ.PnPUBROiVfA8wwulm3lghQ";

export const exportMapAsHTML = async ({
  datasetId,
  dataset,
  tempUnit = "°C",
  viewState,
  compare,
  scenario = 1,
  datasetDescriptionResponse = climateZonesDescriptions,
  precipitationUnit = "mm",
}: ExportProps) => {
  const selectedDataset =
    dataset ??
    (datasets.find((dataset) => dataset.dataset.id === datasetId && dataset.isLatest) as
      | types.Map
      | undefined);
  if (!selectedDataset) {
    throw Error("Either the dataset or datasetId fields must be valid.");
  }

  const mapStyleLink = `mapbox://styles/probablefutures/${selectedDataset.mapStyleId}`;

  const isCompare = compare?.scenarioAfter !== undefined && compare?.scenarioBefore !== undefined;

  const [{ dataKey }] = consts.degreesOptions.filter((d) => d.value === scenario);
  const compareObj = isCompare
    ? {
        show: true,
        dataKeyBefore: consts.degreesOptions.filter((d) => d.value === compare?.scenarioBefore)[0]
          .dataKey,
        dataKeyAfter: consts.degreesOptions.filter((d) => d.value === compare?.scenarioAfter)[0]
          .dataKey,
        dataLayerPaintPropertiesBefore: utils.getMapLayerColors(
          selectedDataset.binHexColors || [],
          selectedDataset.stops || [],
          compare?.scenarioBefore,
        ),
        dataLayerPaintPropertiesAfter: utils.getMapLayerColors(
          selectedDataset.binHexColors || [],
          selectedDataset.stops || [],
          compare?.scenarioAfter,
        ),
        degreesBefore: compare?.scenarioBefore === 0 ? 0.5 : compare?.scenarioBefore,
        degreesAfter: compare?.scenarioAfter === 0 ? 0.5 : compare?.scenarioAfter,
      }
    : undefined;
  const data = {
    mapboxAccessToken: embedAccessToken || "",
    mapStyle: mapStyleLink,
    mapStyleConfigs: {
      dataLayerPaintProperties: utils.getMapLayerColors(
        selectedDataset.binHexColors || [],
        selectedDataset.stops || [],
        scenario,
      ),
      tempUnit,
      degrees: scenario,
      dataKey,
      precipitationUnit,
    },
    dataset: selectedDataset,
    viewState,
    compare: compareObj,
    datasetDescriptionResponse,
  };

  return isCompare ? consts.exportCompareMapToHTML(data) : consts.exportSimpleMapToHTML(data);
};
