import ReactDOMServer from "react-dom/server";
import styled, { ServerStyleSheet } from "styled-components";
import { consts, types, utils } from "@probable-futures/lib";
//@ts-ignore
import { downloadFile } from "kepler.gl";

import { colors } from "../consts";
import { MAP_ID } from "../consts/MapConsts";
import { useAppSelector } from "../app/hooks";
import { EMBEDDABLE_MAPS_MAPBOX_ACCESS_TOKEN } from "../consts/env";
import { buildMapStylesObject } from "./useMapActions";
import { ExportMapProps, exportMapToHTML } from "../consts/export-map-html";
import { DatasetDescriptionResponse } from "@probable-futures/lib/src/types";

const ExportMapHeader = styled.div`
  border: 1px solid ${colors.darkPurple};
  background-color: ${colors.white};
  padding: 15px 10px;
  position: absolute;
  font-size: 16px;
  top: 20px;
  left: 20px;
  margin-right: 20px;
`;

const ExportMapTitle = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  line-height: 11px;
  text-transform: uppercase;
  margin-bottom: 5px;
`;

const ExportMapDescription = styled.p`
  margin: 0;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: bold;

  &:last-child {
    margin-bottom: 0;
  }
`;

// Additional custom CSS
const customCss = `
  .map-control {
    display: none!important;
  }
  
  .map-popover {
    box-sizing: border-box;
    border: 1px solid #39273b;
    background-color: ${colors.white} !important;
    box-shadow: 0 3px 5px 0 rgba(56, 22, 63, 0.23);
    overflow-x: hidden;
  }
  
  .map-popover .map-popover__layer-name,
  .map-popover .popover-arrow-left,
  .map-popover .popover-pin {
    display: none !important;
  }
  
  .map-popover .row__value {
    color: ${colors.black} !important;
    font-size: 13px;
    text-align: left !important;
    word-break: break-all;
  }
  
  .map-popover .row__name {
    font-weight: 600 !important;
    font-size: 13px;
    color: ${colors.black} !important;
    word-break: break-all;
  }
  
  .map-popover .row__name:after {
    content: ":";
  }
  
  .map-popover .coordingate-hover-info {
    display: none !important;
  }
  
  .map-popover .map-popover__layer-info,
  .map-popover .map-popover__layer-info > table {
    margin-top: 0;
  }
`;

type Props = {
  selectedClimateData?: types.Map;
  tempUnit: string;
  bins?: number[];
  degrees: number;
  showBorders: boolean;
  showLabels: boolean;
  percentileValue: utils.BinningType;
  binHexColors?: string[];
  datasetDescriptionResponse?: DatasetDescriptionResponse;
  precipitationUnit: types.PrecipitationUnit;
};

const useExportMapAsHTML = ({
  selectedClimateData,
  bins,
  tempUnit,
  precipitationUnit,
  datasetDescriptionResponse,
  ...mapStyleConfigs
}: Props) => {
  const keplerState = useAppSelector((state) => state.keplerGl[MAP_ID]);
  const projectName = useAppSelector((state) => state.project.projectName);
  const filteredProjectDatasets = useAppSelector((state) => state.project.filteredProjectDatasets);

  const renderHeaderToString = () => {
    if (!selectedClimateData || !filteredProjectDatasets) {
      return [];
    }
    const sheet = new ServerStyleSheet();
    const datasetTitles = filteredProjectDatasets.map((file) => file.datasetName);
    const headerMarkup = ReactDOMServer.renderToString(
      sheet.collectStyles(
        <ExportMapHeader className="embeddable-map-header">
          <ExportMapTitle>Climate map</ExportMapTitle>
          <ExportMapDescription>
            {selectedClimateData.name} in a {mapStyleConfigs.degrees}°C warming scenario
          </ExportMapDescription>
          <ExportMapTitle>Custom Data</ExportMapTitle>
          <ExportMapDescription>{datasetTitles.join(" · ")}</ExportMapDescription>
        </ExportMapHeader>,
      ),
    );

    // Extract the styles generated by styled-components
    const headerStyles = sheet.getStyleTags();

    return [headerMarkup, headerStyles];
  };

  const onExportClick = () => {
    const [headerMarkup, headerStyles] = renderHeaderToString();

    // Concatenate the custom CSS with the extracted styles
    const allStyles = headerStyles + "\n<style>" + customCss + "</style>";

    const schema = keplerState.visState.schema;
    const mapToSave = schema.save(keplerState);
    const [{ dataKey }] = consts.degreesOptions.filter((d) => d.value === mapStyleConfigs.degrees);
    const data: ExportMapProps = {
      ...mapToSave,
      mapboxAccessToken: EMBEDDABLE_MAPS_MAPBOX_ACCESS_TOKEN,
      mapStyle: buildMapStylesObject(selectedClimateData),
      markups: [headerMarkup],
      styles: allStyles,
      mapStyleConfigs: {
        dataLayerPaintProperties: utils.getMapLayerColors(
          mapStyleConfigs.binHexColors || [],
          bins || [],
          mapStyleConfigs.degrees,
          mapStyleConfigs.percentileValue,
        ),
        degrees: mapStyleConfigs.degrees,
        dataKey,
        showBorders: mapStyleConfigs.showBorders,
        showLabels: mapStyleConfigs.showLabels,
        tempUnit,
        precipitationUnit,
      },
      dataset: selectedClimateData,
      datasetDescriptionResponse,
    };
    const fileBlob = new Blob([exportMapToHTML(data)], { type: "text/html" });
    downloadFile(
      fileBlob,
      `${projectName} - ${selectedClimateData?.name} at ${mapStyleConfigs.degrees}°C`,
    );
  };

  return {
    onExportClick,
  };
};

export default useExportMapAsHTML;
