import * as types from "../types";
import * as consts from ".";
import {
  displayBottomLinkFunction,
  displayClimateZonesKey,
  displayHeaderFunction,
  displayKeyFunction,
  displayKeyToggleFunction,
  headerStyles,
  keyStyles,
} from "../utils/embed.shared";
import { DatasetDescriptionResponse } from "../types";

type Props = {
  mapboxAccessToken: string;
  mapStyle: string;
  mapStyleConfigs: {
    dataLayerPaintProperties: (string | number | string[])[];
    tempUnit: string;
    degrees: number;
    dataKey: consts.DegreeDataKeys;
    precipitationUnit: types.PrecipitationUnit;
  };
  dataset: types.Map;
  viewState: Partial<{ longitude: number; latitude: number; zoom: number }>;
  datasetDescriptionResponse: DatasetDescriptionResponse;
  compare?: {
    show: boolean;
    dataKeyBefore: consts.DegreeDataKeys;
    dataKeyAfter: consts.DegreeDataKeys;
    dataLayerPaintPropertiesBefore: (string | number | string[])[];
    dataLayerPaintPropertiesAfter: (string | number | string[])[];
    degreesBefore: number;
    degreesAfter: number;
  };
  showBorders?: boolean;
  showPopupOnFirstLoad?: boolean;
  overrideUIStyles?: { selector: string; styles: any }[];
};

export const exportCompareMapToHTML = (options: Props) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Probable Futures Map</title>
      <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
      <link href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css" rel="stylesheet">
      <link rel="stylesheet" href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-compare/v0.4.0/mapbox-gl-compare.css" type="text/css">
      <style>
        body {margin: 0; padding: 0; font-family: LinearSans, Arial, Helvetica, sans-serif; font-size: 16px; color: #2a172d; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;overflow-x: hidden;}
        a {color: #1c101e;}
        a:hover {color: #851fff;}
        @font-face { font-family: "LinearSans"; src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/LinearSans-Regular.otf") format("opentype"); font-weight: 400; font-style: normal;}
        @font-face { font-family: "LinearSans"; src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.eot"); src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.eot?#iefix") format("embedded-opentype"), url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.woff2") format("woff2"), url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.woff") format("woff"); font-weight: 600; font-style: normal;}
        @font-face { font-family: "RelativeMono"; src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/relative-mono-10-pitch-pro.otf") format("opentype"); font-weight: 400; font-style: normal;}
        @font-face { font-family: "Cambon"; src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/Cambon-Regular.otf") format("opentype"); font-weight: 400; font-style: normal;}
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
        .mapboxgl-ctrl-top-right { top: 50%; transform: translateY(-50%);}
        .mapboxgl-ctrl.mapboxgl-ctrl-group { box-shadow: 0 3px 5px 0 rgb(56 22 63 / 50%); border-radius: 6px; background-color: #fdfdfd; margin-right: 20px;} 
        .mapboxgl-ctrl.mapboxgl-ctrl-group button { width: 35px; height: 35px; border: none; outline: 0; font-family: "LinearSans"; color: #1b1a1c; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;}
        .mapboxgl-ctrl.mapboxgl-ctrl-group button:first-child { border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom: 1px solid rgba(151,151,151,0.5); border-bottom-left-radius: unset; border-bottom-right-radius: unset;}
        .mapboxgl-ctrl.mapboxgl-ctrl-group button:last-child {display: none;}
        .mapboxgl-map {font: unset;}
        .mapboxgl-ctrl-attrib-inner a {font-size: 10px; font-family: Helvetica Neue, Arial, Helvetica, sans-serif; line-height: 20px;}
        .mapboxgl-ctrl-attrib.mapboxgl-compact {transform: scale(0.7); margin-bottom: -1px;}
        .mapboxgl-ctrl-bottom-left {left: unset; right: 45px; z-index:1;}
        @media (min-width: 641px) {.mapboxgl-ctrl-bottom-left {right: 10px; bottom: 15px;}}
        @media (min-width: 1200px) {.mapboxgl-ctrl-bottom-left {bottom: 15px; left: unset; right: 10px;}}
        .mapboxgl-ctrl-bottom-right {right: 0; bottom: 0;}
        @media (max-width: 641px) {
          .mapboxgl-compact-show {margin-right: -18px!important;}
          .mapboxgl-ctrl-logo {transform: scale(0.9); height: 18px!important; margin: 0 -26px -8px -4px!important;}
        }
        .mapbox-improve-map {font-weight: 700;}
        /*popover*/
        .popover-title {display: block;max-width: 210px;color: #1c101e;font-size: 12px;font-weight: 600;line-height: 14px;margin-right: 25px;}
        .popover-title:first-letter{text-transform: uppercase;}
        .popover-description{font-weight: 400;font-size: 10px;max-width: 209px;line-height: 14px;padding: 4px 0px;}
        .popover-no-data {display: block;color: #000000;font-weight: 600;letter-spacing: 0;text-align: center;margin-top: 10px;margin-bottom: 16px;font-size: 20px;}
        .popover-row-container {display: flex;justify-content: center;margin-top: 10px;padding-bottom: 18px;text-align: center;gap: 20px;}
        .popover-value-container {display: flex;flex-direction: column;align-items: center;justify-content: space-around;gap: 5px;}
        .popover-value {display: block;color: #000000;font-weight: 600;letter-spacing: 0;}
        .popover-label {display: block;max-width: 80px;color: #000000;font-size: 10px;letter-spacing: 0;line-height: 10px;text-align: center;box-sizing: border-box;padding: 0px 4px;}
        .popover-label:first-letter{text-transform: lowercase;}
        .popover-mean-frequency-text {display: block;color: #000000;font-weight: 600;letter-spacing: 0;font-size: 20px;}
        .popover-avg-value {display: block;color: #000000;font-weight: 600;letter-spacing: 0;}
        .mapboxgl-popup-content{background-color: #fdfdfd;border-radius: 0;border: 1px solid #2a172d;padding: 16px 16px 0;box-sizing: border-box;box-shadow: none;}
        .mapboxgl-popup-close-button{position: absolute;top: 8px;right: 12px;font-size: 25px;width: 20px;height: 20px;}
        .mapboxgl-popup-close-button:hover{background: transparent;}
        .mapboxgl-popup-tip{width: 12px;height: 12px;transform: rotate(45deg);background-color: #fdfdfd;border-width: 1px !important;margin-bottom: -8px;border-left: 1px solid #2a172d;border-top: 1px solid #2a172d!important;box-sizing: content-box;align-self: center;border-bottom-color: #fff;}
        #beforeMap, #afterMap {overflow: hidden;position: absolute;height: 100%;z-index: 1;user-select: none;width: 100%;}
        .comparison-container {overflow: hidden;position: relative;height: 100%;z-index: 1;}
        .mapboxgl-compare {background-color: rgb(42, 23, 45);height: 100%;position: absolute;width: 2px;z-index: 1;}
        .mapboxgl-compare .compare-swiper-vertical {background-color: #1b1a1c;background-repeat: no-repeat, no-repeat;background-size: 41px;border-radius: 50%;box-shadow: #f8f9f3 0 0 0 2px inset;color: #f8f9f3;cursor: ew-resize;display: inline-block;height: 40px;left: -20px;margin: -20px 1px 0;position: absolute;top: 50%;width: 40px; transition: top 0.5s ease-in-out;}
        .mapboxgl-compare .compare-swiper-vertical::before,
        .mapboxgl-compare .compare-swiper-vertical::after {background-color: #1b1a1c;border: 1px solid #fefffc;color: #f8f9f3;display: block;font-family: RelativeMono,monospace;font-size: 15px;line-height: 1;padding: 2px 0 4px 0;position: absolute;text-align: center;top: 10px;width: 62px;}
        ${headerStyles}
        ${keyStyles}
      </style>
      <style id="dynamic-slider-styles">
        .mapboxgl-compare .compare-swiper-vertical::before {content: "${
          options.compare?.degreesBefore
        }°C";left: -71px;}  
        .mapboxgl-compare .compare-swiper-vertical::after {content: "${
          options.compare?.degreesAfter
        }°C";right: -71px;}
      </style>
      <script src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"></script>
      <script src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-compare/v0.4.0/mapbox-gl-compare.js"></script>
      <!-- Open Graph / Facebook -->
      <meta property="og:title" content="Probable Futures Map" />
      <meta
        property="og:description"
        content="Probable Futures aims to increase the chances that the future is good. We offer useful tools to visualize climate change along with stories and insights to help people understand what those changes mean."
        data-react-helmet="true"
      />
      <meta property="og:type" content="website" />
      <meta
        property="og:image"
        content="http://probablefutures.org/assets/images/pf-gradient-1.jpg"
      />
      <meta property="og:image:width" content="1920" />
      <meta property="og:image:height" content="1080" />
      <meta property="og:url" content="http://probablefutures.org" />
  
      <!-- Twitter -->
      <meta name="twitter:title" content="Probable Futures Map" />
      <meta name="twitter:card" content="summary" />
      <meta
        name="twitter:description"
        content="Probable Futures aims to increase the chances that the future is good. We offer useful tools to visualize climate change along with stories and insights to help people understand what those changes mean."
        data-react-helmet="true"
      />
      <meta
        property="twitter:image"
        content="http://probablefutures.org/assets/images/pf-gradient-1.jpg"
      />
      <meta name="twitter:url" content="http://probablefutures.org" />
    </head>
    <body>
      <div id="comparison-container"><div id="beforeMap"></div><div id="afterMap"></div></div>
      <script>
        (function() {
          const datasetsWithMidValuesOnly = [${consts.datasetsWithMidValuesOnly.toString()}];
          function cToF(value) {
            return Math.floor((value * 9) / 5 + 32);
          }
          
          function convertCToF(values) {
            if (values === undefined) {
              return values;
            }
            return Array.isArray(values) ? values.map(cToF) : cToF(values);
          }
          function mmToin(value) {
            return parseFloat((value / 25.4).toFixed(1));
          }
          function convertmmToin(values) {
            if (values === undefined) {
              return values;
            }
            return Array.isArray(values) ? values.map(mmToin) : mmToin(values);
          }
          function getBinLabel(bins, index, unit, minValue, maxValue, step, tempUnit, isDiff=false, isFrequent=false, precipitationUnit, isPrecipitationMap){
            const isTempMap = unit.toLowerCase().includes("temp");

            let finalBins = bins;
            let finalMinValue = minValue;
            let finalMaxValue = maxValue;
            if (isTempMap && tempUnit === "°F") {
              finalBins = convertCToF(bins);
              finalMinValue = convertCToF(minValue);
              finalMaxValue = convertCToF(maxValue);
            } else if (isPrecipitationMap && precipitationUnit === "in") {
              finalBins = convertmmToin(bins);
              finalMinValue = convertmmToin(minValue);
              finalMaxValue = convertmmToin(maxValue);
            }
            const plusSign = isDiff && !isFrequent ? "+" : "";
            const prevBin = finalBins[index - 1];
            const curBin = finalBins[index];

            if (index > bins.length) {
              return [];
            }

            if (index === 0) {
              if (finalMinValue === 0 && finalMinValue === finalBins[index] - 1 && !isDiff) {
                return [finalMinValue.toString()];
              } else if (!isDiff) {
                return [finalMinValue.toString(), parseFloat((curBin - step).toFixed(1)).toString()];
              } else {
                return [curBin > 0 ? "< " + plusSign.concat(curBin.toString()) : "< " + curBin];
              }
            }

            if (!isDiff) {
              const firstBin = prevBin.toString();
              let secondBin = "";

              if (index === finalBins.length) {
                secondBin = finalMaxValue.toString();
              } else {
                secondBin = parseFloat((curBin - step).toFixed(1)).toString();
              }
              return [firstBin, secondBin];
            } else {
              if (index === finalBins.length) {
                return [
                  prevBin - step > 0
                    ? "> " + plusSign.concat(parseFloat((prevBin - step).toFixed(1)).toString())
                    : "> " + parseFloat((prevBin - step).toFixed(1)).toString(),
                ];
              } else {
                if (prevBin === curBin - step) {
                  return [prevBin > 0 ? plusSign.concat(prevBin.toString()) : prevBin.toString()];
                } else {
                  return [
                    prevBin > 0 ? plusSign.concat(prevBin.toString()) : prevBin.toString(),
                    curBin - step > 0 
                      ? plusSign.concat(parseFloat((curBin - step).toFixed(1)).toString())
                      : parseFloat((curBin - step).toFixed(1)).toString(),
                  ];
                }
              }
            }
          };
          function getLabelByValue(value,binningType,binningLabels,stops) {
            if (binningType === "range") {
              let labelIdx = -1;
              stops.forEach((stop, index) => {
                if (labelIdx === -1) {
                  if (index === 0 && value < stop) {
                    labelIdx = 0;
                  } else {
                    const range = [stops[index - 1], stop];
                    if (value >= range[0] && value < range[1]) {
                      labelIdx = index;
                    }
                  }
                }
              });
              if (labelIdx === -1 && value >= stops[stops.length - 1]) {
                labelIdx = stops.length;
              }
              return binningLabels[labelIdx];
            } else if (binningType === "number") {
              let labelIdx = 0;
              stops.forEach((stop, index) => {
                if (stop === value) {
                  labelIdx = index + 1;
                }
              });
              return binningLabels[labelIdx];
            }
          }
          
          function getClimateZoneByValue(datasetDescriptionResponse, midValue) {
            let climateZoneSubGroup;
            datasetDescriptionResponse.climate_zones?.forEach((climateZonesDescription) => {
              climateZonesDescription.list.forEach((climateZone) => {
                if (parseInt(climateZone.value) === midValue) {
                  climateZoneSubGroup = climateZone;
                }
              });
            });
            return climateZoneSubGroup;
          }
          const MAP_VERSION_URL = "${consts.MAP_VERSION_URL}";
          const pfLayerIds = [${consts.interactiveClimateLayerIds
            .map((id) => `"${id}"`)
            .join(", ")}, "water"];
          let { dataLayerPaintProperties, dataKey, degrees } = ${JSON.stringify(
            options.mapStyleConfigs,
          )};
          let degreesBefore = '${options.compare?.degreesBefore}';
          let degreesAfter = '${options.compare?.degreesAfter}';
          
          let dataset = ${JSON.stringify(options.dataset)};
          mapboxgl.accessToken = '${options.mapboxAccessToken}';
          let tempUnit = '${options.mapStyleConfigs.tempUnit}';
          let precipitationUnit = '${options.mapStyleConfigs.precipitationUnit}';
          const isFrequent = dataset?.dataset.unit === "x as frequent";
          const datasetDescriptionResponse = ${JSON.stringify(options.datasetDescriptionResponse)};
          const showBorders = ${options.showBorders};
          const showPopupOnFirstLoad = ${options.showPopupOnFirstLoad};
          let showBaselineDetails = dataset.isDiff && degrees !== 0 && !isFrequent;
          let beforeMap, afterMap;
          let longitude=null, latitude=null, popup=null, mapClicked, featuresBefore=[], featuresAfter=[];
          let { dataKeyBefore, dataKeyAfter, dataLayerPaintPropertiesBefore, dataLayerPaintPropertiesAfter, show: showCompare } = ${JSON.stringify(
            options.compare || {},
          )};
          let isTempMap = dataset.dataset.pfDatasetUnitByUnit.unitLong.toLowerCase().includes("temp");
          const isPrecipitationMap = dataset.dataset.unit === "mm";
          let initiallyLoadedInspector = false;
          let beforeMapIsIdle = false;
          let afterMapIsIdle = false;
          function onStyleLoad(map, dataLayerPaintProperties) {
            let { layers } = map?.getStyle();
            layers.forEach(function({id, type}){
              if (id.includes('region-')) {
                map?.setPaintProperty(id, "fill-color", dataLayerPaintProperties);
                map?.setPaintProperty(id, "fill-antialias", ["step", ["zoom"], false, 6, true]);
                map?.setPaintProperty(id, "fill-outline-color", "#ffffff");
              } else if (type === "symbol" || id.includes("road")) {
                map.setLayoutProperty(id, "visibility", "visible");
              } else if (id.includes("boundary")) {
                map.setLayoutProperty(id, "visibility", showBorders ? "visible" : "none");
              }
            });
          }
          function showInspectorOnIdle() {
            if(showPopupOnFirstLoad && !initiallyLoadedInspector) {
              const lat = ${options.viewState.latitude || 0};
              const lng = ${options.viewState.longitude || 0};
              setTimeout(() => {
                beforeMap.fire("click", {
                  lngLat: { lng, lat },
                  point: beforeMap.project({ lng, lat }),
                  originalEvent: {},
                });
                afterMap.fire("click", {
                  lngLat: { lng, lat },
                  point: afterMap.project({ lng, lat }),
                  originalEvent: {},
                });
                initiallyLoadedInspector = true;
              }, 200);
            }
          }
          // initialize beforeMap
          beforeMap = new mapboxgl.Map({
            container: 'beforeMap', style: '${options.mapStyle}', 
            center: [${options.viewState.longitude || 0},${options.viewState.latitude || 0}], 
            zoom: ${
              options.viewState.zoom || 2.2
            }, minZoom: 2.2, maxZoom: 10, projection: 'mercator'});
          beforeMap.addControl(new mapboxgl.NavigationControl());
          beforeMap.on("style.load", function() {
            onStyleLoad(beforeMap, dataLayerPaintPropertiesBefore);
          });
          beforeMap.on("idle", function () {
            beforeMapIsIdle = true;
            if(afterMapIsIdle) {
              showInspectorOnIdle();
            }
          });
          // initialize afterMap
          afterMap = new mapboxgl.Map({ 
            container: 'afterMap', style: '${options.mapStyle}', 
            center: [${options.viewState.longitude || 0}, ${options.viewState.latitude || 0}], 
            zoom: ${
              options.viewState.zoom || 2.2
            }, minZoom: 2.2, maxZoom: 10, projection: 'mercator'});
          afterMap.addControl(new mapboxgl.NavigationControl());
          afterMap.on("style.load", function() {
            onStyleLoad(afterMap, dataLayerPaintPropertiesAfter);
          });
          afterMap.on("idle", function () {
            afterMapIsIdle = true;
            if(beforeMapIsIdle) {
              showInspectorOnIdle();
            }
          });
          beforeMap.on('click', pfLayerIds , function(e) {
            latitude = e.lngLat.lat;
            longitude = e.lngLat.lng;
            mapClicked = "before";
            const afterMapFeatures = afterMap.queryRenderedFeatures([e.point.x, e.point.y]);
            featuresBefore = e.features;
            featuresAfter = afterMapFeatures;
            handleMapClick(beforeMap, dataKeyBefore, e.features);
            handleMapClick(afterMap, dataKeyAfter, afterMapFeatures);
          });
          afterMap.on('click', pfLayerIds, function(e) {
            latitude = e.lngLat.lat;
            longitude = e.lngLat.lng;
            mapClicked = "after";
            const beforeMapFeatures = afterMap.queryRenderedFeatures([e.point.x, e.point.y]);
            featuresAfter = e.features;
            featuresBefore = beforeMapFeatures;
            handleMapClick(afterMap, dataKeyAfter, e.features);
            handleMapClick(beforeMap, dataKeyBefore, beforeMapFeatures);
          });
          beforeMap.scrollZoom.disable();
          afterMap.scrollZoom.disable();
          let compareMap = new mapboxgl.Compare(beforeMap, afterMap, "#comparison-container", {});

          ${displayHeaderFunction}
          ${displayBottomLinkFunction}
          ${displayClimateZonesKey}
          ${displayKeyToggleFunction}
          ${displayKeyFunction}

          const checkEdgeCaseForPrecipitationBinsAfterConvertingToInch = (value) => {
            if (value === -51 || value === -26) {
              return convertmmToin(value) - 0.1;
            }
            return convertmmToin(value);
          };
          
          function mapPopupVisible (map) {
            return map._popups?.length > 0;
          }

          function getPopupLngLat (map) {
            return map._popups[0]._lngLat;
          }
          
          function handleMapClick(map, key, features) {
            map._popups.forEach(popup => popup.remove());
            if (!key || !features) {
              return;
            }
            let dataFeature = features ? 
              features.find(function(feature) { 
                return feature.layer.id.includes("region-")
              }) 
              : undefined;
            let selectedData = {
              mid:  dataFeature?.properties[key + "_mid"],
              low: dataFeature?.properties[key + "_low"],
              high: dataFeature?.properties[key + "_high"]
            };
            let showInF = isTempMap && tempUnit === "°F";
            const showInInch = isPrecipitationMap && precipitationUnit === "in";
            let isMidValid = selectedData.mid !== undefined && selectedData.mid !== -99999 && selectedData.mid !== -88888;
            let title = "";
            let unit = "";
            if (
              dataset.dataset.unit !== "z-score" &&
              !datasetsWithMidValuesOnly.includes(dataset.dataset.id)
            ) {
              if (isPrecipitationMap) {
                unit = " (" +  precipitationUnit + ") ";
              } else if (isTempMap) {
                unit = " (" +  tempUnit + ") ";
              } else {
                unit = " (" + dataset.dataset.unit + ") ";
              }
            }
            if (dataset.dataset.unit === "class" && dataset.binLabels && isMidValid) {
              title = getClimateZoneByValue(datasetDescriptionResponse,selectedData.mid)?.name || "";
            }
            else if (datasetsWithMidValuesOnly.includes(dataset.dataset.id)) title = "Expected outcome" + unit;
            else title = "Expected range of outcomes" + unit;
            let result = \`<div><div class="popover-title">\${title}</div>\`;
            if (!isMidValid) result += "<span class='popover-no-data'>No data here</span>";
            else if(dataset.dataset.unit === "class") {
              const climateZoneDesc = getClimateZoneByValue(datasetDescriptionResponse, selectedData.mid)?.description || "";
              result += \`<div class='popover-description'>\${climateZoneDesc}</div>\`;
            }
            else {
              let lowValue = selectedData.low,
                highValue = selectedData.high,
                meanValue = selectedData.mid;
              if (showInF) {
                lowValue = convertCToF(selectedData.low);
                highValue = convertCToF(selectedData.high);
                meanValue = convertCToF(selectedData.mid);
              } else if (showInInch) {
                lowValue = checkEdgeCaseForPrecipitationBinsAfterConvertingToInch(selectedData.low);
                highValue = checkEdgeCaseForPrecipitationBinsAfterConvertingToInch(selectedData.high);
                meanValue = checkEdgeCaseForPrecipitationBinsAfterConvertingToInch(selectedData.mid);
              }
              let showMidValueLabel = !dataset?.isDiff || lowValue !== undefined || highValue !== undefined;
              function getMidValue() {
                if (meanValue === undefined) {
                  return null;
                }
                let prefix = "",
                  suffix = "";
                if (isFrequent && meanValue >= 1) {
                  suffix = "x";
                } else if (
                  dataset?.dataset.unit === "mm" &&
                  datasetsWithMidValuesOnly.includes(dataset.dataset.id)
                ) {
                  suffix = " " +  precipitationUnit;
                } else if (dataset?.dataset.unit === "%") {
                  suffix = "%";
                }
                if (showBaselineDetails && meanValue > 0) {
                  prefix = "+";
                }
                return prefix + meanValue + suffix;
              }
              function getValue(value, getter) {
                if (dataset?.binLabels) return getLabelByValue(value, dataset.binningType, dataset.binLabels, dataset.stops);
                else if (getter) return getter();
                return showBaselineDetails && value > 0 ? \`+\${value}\` : value;
              }
              let popoverContent = "<div class='popover-row-container'>";
              let fontSize = dataset.binLabels ? "14px;" : "20px;";
              let fontSizeMid = dataset.binLabels ? "24px;" : "40px;";
              let valueMargin = dataset.binLabels ? "10px 0 4px;" : "18px 0 4px;";
              if(lowValue !== undefined) popoverContent += \`<div class="popover-value-container"><span style="font-size:\${fontSize};margin:\${valueMargin}" class="popover-value">\${getValue(lowValue)}</span><span class="popover-label">\${dataset?.dataLabels[0]}</span></div>\`;
              if(meanValue !== undefined) {
                popoverContent += "<div class='popover-value-container'>";
                if (isFrequent && meanValue < 1) popoverContent += "<span class='popover-mean-frequency-text'>Less frequent</span>";
                else popoverContent += \`<span style="font-size:\${fontSizeMid}" class="popover-avg-value">\${getValue(meanValue, getMidValue)}</span>\`
                if(showMidValueLabel) popoverContent+= \`<span class="popover-label">\${dataset?.dataLabels[1]}</span>\`;
                popoverContent += "</div>";
              }
              if(highValue !== undefined) popoverContent += \`<div class="popover-value-container"><span style="font-size:\${fontSize};margin:\${valueMargin}" class="popover-value">\${getValue(highValue)}</span><span class="popover-label">\${dataset?.dataLabels[2]}</span></div>\`;
              popoverContent += "</div>";
              result += popoverContent;
            }
            result += "</div>";
            popup = new mapboxgl.Popup({anchor: "top", maxWidth:"none", focusAfterOpen: false})
            .setLngLat({lng: longitude, lat: latitude})
            .setHTML(result)
            .addTo(map);
            popup.on("close", function(e) {
              handleMapClick(beforeMap);
              handleMapClick(afterMap);
            })
          }
          function handleToggleChange() {
            let isChecked;
            if(isTempMap) {
              tempUnit = tempUnit === "°C" ? "°F" : "°C";
              isChecked = tempUnit === "°F";
            } else {
              precipitationUnit = precipitationUnit === "mm" ? "in" : "mm";
              isChecked = precipitationUnit === "in";
            }
            dataset.binHexColors.map(function(color, index) {
              const [from, to] = getBinLabel(dataset.stops, index, dataset.dataset.pfDatasetUnitByUnit.unitLong, 
                dataset.dataset.minValue, dataset.dataset.maxValue, dataset.dataset.unit === "mm" && precipitationUnit === "in" ? 0.1 : dataset.step,
                tempUnit, dataset.isDiff, isFrequent, precipitationUnit, isPrecipitationMap);
              const innerBinSpan = document.getElementsByClassName("map-key-inner-bin-label")[index];
              if(innerBinSpan) {
                while (innerBinSpan.firstChild) {
                  innerBinSpan.removeChild(innerBinSpan.firstChild);
                }
                const fromText = document.createTextNode(from);
                innerBinSpan.appendChild(fromText);
                if(to !== undefined) {
                  const toText = document.createTextNode(to);
                  const dashSpan = document.createElement("span");
                  dashSpan.textContent = "-";
                  innerBinSpan.appendChild(dashSpan);
                  innerBinSpan.appendChild(toText);
                }
              }
            });
            const toggleOptionLeft = document.getElementById("toggle-option1");
            if(isChecked) toggleOptionLeft.style.color = "#2a172d";
            else toggleOptionLeft.style.color = "#fdfdfd";

            const toggleOptionRight = document.getElementById("toggle-option2");
            if(isChecked) toggleOptionRight.style.color = "#fdfdfd";
            else toggleOptionRight.style.color = "#2a172d";

            const keyLabel = document.getElementsByClassName("map-key-label")[0];
            if (keyLabel) {
              keyLabel.textContent = isTempMap
                ? dataset.dataset.pfDatasetUnitByUnit.unitLong.replace(
                    "°C",
                    tempUnit
                  )
                : dataset.dataset.pfDatasetUnitByUnit.unitLong;
            }
            if (beforeMap._popups.length > 0) handleMapClick(beforeMap, dataKeyBefore, featuresBefore);
            if (afterMap._popups.length > 0) handleMapClick(afterMap, dataKeyAfter, featuresAfter);
          };
          displayHeader();
          displayBottomLink();
          if(dataset.dataset.unit === "class") displayClimateZoneKey();
          else displayKey();
          // event listeners
          window.addEventListener('message', (event) => {
            const { action, dataKeyBefore: dataKeyBeforeFromEvent, 
              dataKeyAfter: dataKeyAfterFromEvent, degreeBefore, degreeAfter, 
              dataLayerPaintPropertiesBefore: dataLayerPaintPropertiesBeforeFromEvent,
              dataLayerPaintPropertiesAfter: dataLayerPaintPropertiesAfterFromEvent } = event.data;
            if(action === "onDegreeChanged") {
              degreesBefore = degreeBefore;
              degreesAfter = degreeAfter;
              dataKeyBefore = dataKeyBeforeFromEvent;
              dataKeyAfter = dataKeyAfterFromEvent;
              dataLayerPaintPropertiesBefore = dataLayerPaintPropertiesBeforeFromEvent;
              dataLayerPaintPropertiesAfter = dataLayerPaintPropertiesAfterFromEvent;
              onStyleLoad(beforeMap, dataLayerPaintPropertiesBefore);
              onStyleLoad(afterMap, dataLayerPaintPropertiesAfter);
              const styleSheet = document.getElementById("dynamic-slider-styles").sheet;
              // Remove the old rule (assuming it's the first rule)
              if (styleSheet.cssRules.length > 1) {
                styleSheet.deleteRule(0);
                styleSheet.deleteRule(0);
              }
              // Add the new rule with the updated content
              styleSheet.addRule(
                ".mapboxgl-compare .compare-swiper-vertical::before",
                \`content: "\${degreesBefore + "°C"}"; left: -71px;\`
              );
              styleSheet.addRule(
                ".mapboxgl-compare .compare-swiper-vertical::after",
                \`content: "\${degreesAfter + "°C"}"; left: 47px;\`
              );
              if(mapPopupVisible(beforeMap)) {
                setTimeout(() => {
                  const {lat, lng} = getPopupLngLat(beforeMap);
                  handleMapClick(beforeMap);
                  beforeMap.fire("click", {
                    lngLat: { lng, lat },
                    point: beforeMap.project({ lng, lat }),
                    originalEvent: {},
                  });
                }, 200);
              }
              if(mapPopupVisible(afterMap)) {
                setTimeout(() => {
                  const {lat, lng} = getPopupLngLat(afterMap);
                  handleMapClick(afterMap);
                  afterMap.fire("click", {
                    lngLat: { lng, lat },
                    point: afterMap.project({ lng, lat }),
                    originalEvent: {},
                  });
                }, 200);
              }
            }
          });
        })();
        // apply additional styles if passed.
        const overrideUIStyles = ${JSON.stringify(options.overrideUIStyles)};
        window.onload = function() {
          if(overrideUIStyles?.length) {
            overrideUIStyles.forEach((overrideStyle) => {
              const { selector, styles } = overrideStyle;
              if(selector) {
                const targetElement = document.querySelector(selector);
                if (targetElement && styles) {
                  Object.assign(targetElement.style, styles);
                }
              }
            })
          }
        };
      </script>
    </body>
  </html>`;
};
