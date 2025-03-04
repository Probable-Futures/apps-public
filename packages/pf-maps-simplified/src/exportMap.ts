import { consts, types, utils, DatasetDescriptionResponse } from "@probable-futures/lib";

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
  showBorders?: boolean;
  showPopupOnFirstLoad?: boolean;
  overrideUIStyles?: { selector: string; styles: any }[];
  hideTitle?: boolean;
  hideControls?: boolean;
  hideMapLegend?: boolean;
  hideResetMapButton?: boolean;
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
  datasetDescriptionResponse = consts.climateZonesDescriptions,
  precipitationUnit = "mm",
  showBorders,
  showPopupOnFirstLoad,
  overrideUIStyles,
  hideControls,
  hideMapLegend,
  hideTitle,
  hideResetMapButton,
}: ExportProps) => {
  const selectedDataset =
    dataset ??
    (consts.datasets.find((dataset) => dataset.dataset.id === datasetId && dataset.isLatest) as
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
    showBorders,
    showPopupOnFirstLoad,
    overrideUIStyles,
    hideControls,
    hideMapLegend,
    hideTitle,
    hideResetMapButton,
  };

  return isCompare ? consts.exportCompareMapToHTML(data) : consts.exportSimpleMapToHTML(data);
};
