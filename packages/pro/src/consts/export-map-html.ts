import { consts, types } from "@probable-futures/lib";
import { DatasetDescriptionResponse } from "@probable-futures/lib/src/types";
import {
  displayBottomLinkFunction,
  displayClimateZonesKey,
  displayKeyFunction,
  displayKeyToggleFunction,
  keyStyles,
} from "@probable-futures/lib/src/utils/embed.shared";

export type ExportMapProps = {
  mapboxAccessToken: string;
  mapStyle: string;
  markups: string[];
  styles: string;
  datasets: any;
  config: any;
  mapStyleConfigs: {
    dataLayerPaintProperties: (string | number | string[])[];
    tempUnit: string;
    showBorders: boolean;
    showLabels: boolean;
    degrees: number;
    dataKey: consts.DegreeDataKeys;
    precipitationUnit: types.PrecipitationUnit;
  };
  dataset: types.Map;
  longitude: number;
  latitude: number;
  zoom: number;
  datasetDescriptionResponse: DatasetDescriptionResponse;
};

export const exportMapToHTML = (options: ExportMapProps, version = "2.5.5") => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
        <title>Probable Futures Pro map</title>
        <link rel="stylesheet" href="https://d1a3f4spazzrp4.cloudfront.net/kepler.gl/uber-fonts/4.0.0/superfine.css">
        <link href="https://api.tiles.mapbox.com/mapbox-gl-js/v1.1.1/mapbox-gl.css" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/animations/scale.css"/>
        <link rel="stylesheet" href="https://unpkg.com/tippy.js@6/themes/light.css"/>
        ${options.styles}
        <style type="text/css">
          body {margin: 0; padding: 0; font-family: LinearSans, Arial, Helvetica, sans-serif; font-size: 16px; color: #2a172d; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;}
          a {color: #1c101e;}
          a:hover {color: #851fff;}
          .zoom-button-container { line-height: 1.15; font-family: "LinearSans"; font-size: 16px; color: #2a172d; flex-direction: column;border-radius: 6px; box-shadow: 0 3px 5px 0 rgb(56 22 63 / 50%); outline: 0; padding: 0; display: flex; position: absolute; background-color: #fdfdfd; z-index: 1; right: 20px; top: 50%; transform: translateY(-50%);}
          .zoom-button { margin: 0; text-transform: none; display: flex; align-items: center; justify-content: center; width: 35px;
              height: 35px; border: none; outline: 0; background-color: transparent; font-family: "LinearSans"; color: #2a172d; cursor: pointer; padding: 0;}
          .zoom-button:hover { background-color: #2a172d;}
          .zoom-button:hover svg { filter: invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);}
          #zoom-in { border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom: 1px solid rgba(151,151,151,0.5);}
          #zoom-out { border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;}
          @font-face { font-family: "LinearSans"; src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/LinearSans-Regular.otf") format("opentype"); font-weight: 400; font-style: normal;}
          @font-face { font-family: "LinearSans"; src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.eot"); src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.eot?#iefix") format("embedded-opentype"), url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.woff2") format("woff2"), url("https://pf-fonts.s3.us-west-2.amazonaws.com/linear-sans-semibold.woff") format("woff"); font-weight: 600; font-style: normal;}
          @font-face { font-family: "RelativeMono"; src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/relative-mono-10-pitch-pro.otf") format("opentype"); font-weight: 400; font-style: normal;}
          @font-face { font-family: "Cambon"; src: url("https://pf-fonts.s3.us-west-2.amazonaws.com/Cambon-Regular.otf") format("opentype"); font-weight: 400; font-style: normal;}
          .mapboxgl-map {font-family: LinearSans, Arial, Helvetica, sans-serif;}
          .mapboxgl-ctrl-attrib-inner a {font-size: 10px; font-family: Helvetica Neue, Arial, Helvetica, sans-serif; line-height: 20px;}
          .mapboxgl-ctrl-attrib.mapboxgl-compact {margin-bottom: 5px;}
          .mapboxgl-ctrl-bottom-left {bottom: 67px; left: unset; right: 45px;}
          @media (min-width: 641px) {.mapboxgl-ctrl-bottom-left {right: 10px; bottom: 58px;}.mapboxgl-ctrl {margin-bottom: 23px;}}
          @media (min-width: 1200px) {.mapboxgl-ctrl-bottom-left {bottom: 15px; left: unset; right: 10px;}.mapboxgl-ctrl {margin-bottom: 10px;}}
          .mapboxgl-ctrl-bottom-right {right: 0; bottom: 0;}
          @media (max-width: 1200px) {.mapboxgl-ctrl-bottom-right{bottom: 52px;}}
          @media (max-width: 641px) {.mapboxgl-ctrl-bottom-right {bottom: 67px;}}
          @media (min-width: 1200px) {.mapboxgl-ctrl-bottom-right{right: 0; bottom: 0;}}
          .mapbox-improve-map {font-weight: 700;}
          /*popover*/
          .popover-title {display: block;max-width: 200px;color: #1c101e;font-size: 12px;font-weight: 600;line-height: 14px;margin-right: 25px;}
          .popover-title:first-letter{text-transform: uppercase;}
          .popover-description{font-weight: 400;font-size: 10px;max-width: 209px;line-height: 14px;padding: 4px 0px;}
          .popover-no-data {display: block;color: #000000;font-weight: 600;letter-spacing: 0;text-align: center;margin-top: 10px;margin-bottom: 16px;font-size: 20px;}
          .popover-row-container {display: flex;justify-content: center;margin-top: 10px;padding-bottom: 18px;text-align: center;gap: 30px;}
          .popover-value-container {display: flex;flex-direction: column;align-items: center;justify-content: space-around;gap: 10px;}
          .popover-value {display: block;margin: 18px 0 4px;color: #000000;font-weight: 600;letter-spacing: 0;}
          .popover-label {display: block;max-width: 80px;color: #000000;font-size: 10px;letter-spacing: 0;line-height: 10px;text-align: center;text-transform: capitalize;box-sizing: border-box;padding: 0px 4px;}
          .popover-mean-frequency-text {display: block;color: #000000;font-weight: 600;letter-spacing: 0;font-size: 20px;}
          .popover-avg-value {display: block;color: #000000;font-weight: 600;letter-spacing: 0;}
          .tippy-box {transition-duration: 300ms;display: flex;flex-direction: column;max-width: unset!important;max-height: 600px;padding: 16px;padding-bottom: 0px;background-color: #fdfdfd;color: #1c101e;box-sizing: border-box;border: 1px solid #39273b;box-shadow: 0 3px 5px 0 rgba(56,22,63,0.23);border-radius: 0; font-family: 'LinearSans';}
          .tippy-content{padding: 0;}
          .tippy-box:before{content: "";width: 14px;height: 14px;position: absolute;transform: rotate(45deg);background-color: #2a172d;top: -7px;right: calc(50% - 8px);pointer-events: none;}
          .tippy-box:after{content: "";width: 14px;height: 14px;position: absolute;transform: rotate(45deg);background-color: #fdfdfd;top: -6px;right: calc(50% - 8px);z-index: 1;pointer-events: none;}
          .tippy-arrow{display: none;}
          #tippy-close-button{position: absolute;top: -8px;right: 0;font-size: 25px;width: 20px;height: 20px;background-color: transparent;border: 0;border-radius: 0 3px 0 0;cursor: pointer;}
          .embeddable-map-header{font-family: LinearSans, Arial, Helvetica, sans-serif;}
          .kepler-gl {height: 100%; position: relative; overflow: hidden;}
          ${keyStyles}
        </style>
        <!-- Open Graph / Facebook -->
        <meta property="og:title" content="Probable Futures Pro" />
        <meta property="og:description" content="Probable Futures aims to increase the chances that the future is good. We offer useful tools to visualize climate change along with stories and insights to help people understand what those changes mean." data-react-helmet="true"/>
        <meta property="og:type" content="website" />
        <meta property="og:image" content="http://probablefutures.org/assets/images/pf-gradient-1.jpg"/>
        <meta property="og:image:width" content="1920 " />
        <meta property="og:image:height" content="1080" />
        <meta property="og:url" content="http://probablefutures.org" />
        <!-- Twitter -->
        <meta name="twitter:title" content="Probable Futures Pro" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:description" content="Probable Futures aims to increase the chances that the future is good. We offer useful tools to visualize climate change along with stories and insights to help people understand what those changes mean." data-react-helmet="true"/>
        <meta property="twitter:image" content="http://probablefutures.org/assets/images/pf-gradient-1.jpg" />
        <meta name="twitter:url" content="http://probablefutures.org" />
        <!-- Load React/Redux -->
        <script src="https://unpkg.com/react@16.8.4/umd/react.production.min.js" crossorigin></script>
        <script src="https://unpkg.com/react-dom@16.8.4/umd/react-dom.production.min.js" crossorigin></script>
        <script src="https://unpkg.com/redux@3.7.2/dist/redux.js" crossorigin></script>
        <script src="https://unpkg.com/react-redux@7.1.3/dist/react-redux.min.js" crossorigin></script>
        <script src="https://unpkg.com/styled-components@4.1.3/dist/styled-components.min.js" crossorigin></script>
        <!-- Load Kepler.gl -->
        <script src="https://unpkg.com/kepler.gl@${version}/umd/keplergl.min.js" crossorigin></script>
        <script src="https://unpkg.com/@popperjs/core@2"></script>
        <script src="https://unpkg.com/tippy.js@6"></script>
        <script type="module">
          window.addEventListener('DOMContentLoaded', async () => {
            try {
              const module = await import('https://cdn.jsdelivr.net/npm/viewport-mercator-project@7.0.4/+esm');
              window.viewportMercatorProject = module.default;
            } catch (error) {
              console.error('Error loading the package:', error);
            }
          });
        </script>
      </head>
      <body>
        <div id="app"></div>
        ${options.markups.map((markup: string) => markup)}
        <script>
          (function() {
            const datasetsWithMidValuesOnly = [${consts.datasetsWithMidValuesOnly.toString()}];
            let dataset = ${JSON.stringify(options.dataset)};
            const datasetDescriptionResponse = ${JSON.stringify(
              options.datasetDescriptionResponse,
            )};
            const MAP_VERSION_URL = "${consts.MAP_VERSION_URL}";
            const isFrequent = dataset?.dataset.unit === "x as frequent";
            let tempUnit = '${options.mapStyleConfigs.tempUnit}';
            let precipitationUnit = '${options.mapStyleConfigs.precipitationUnit}';
            const {showBorders, showLabels, dataLayerPaintProperties, dataKey, degrees } = ${JSON.stringify(
              options.mapStyleConfigs,
            )};
            let isTempMap = dataset.dataset.pfDatasetUnitByUnit.unitLong.toLowerCase().includes("temp");
            const isPrecipitationMap = dataset.dataset.unit === "mm";
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
            let map = null;
            function getFeature(features,longitude,latitude,x,y,dataKey){
              let dataFeature = features? features.find(function(feature) { return feature.layer.id.includes("region-")}) : undefined;
              return {
                latitude,
                longitude,
                x,
                y,
                selectedField: dataKey,
                selectedData: {
                  mid:  dataFeature?.properties[dataKey + "_mid"],
                  low: dataFeature?.properties[dataKey + "_low"],
                  high: dataFeature?.properties[dataKey + "_high"]
                }
              };
            };
            function createVirtualReference(container, x = 0, y = 0, size = 0) {
              let bounds = container && container.getBoundingClientRect ? container.getBoundingClientRect() : {};
              let left = (bounds.left || 0) + x - size / 2;
              let top = (bounds.top || 0) + y - size / 2;
              return {left,top,right: left + size,bottom: top + size,width: size,height: size};
            };
            function getCoordinate(viewport, lngLat) {
              let screenCoord = !viewport || !lngLat ? null : viewport.project(lngLat);
              return screenCoord && { x: screenCoord[0], y: screenCoord[1] };
            };
            // Store
            let UPDATE_CLICKED_MAP_INFO = "UPDATE_CLICKED_MAP_INFO";
            let initialState = {clickedMapInfo: undefined};
            function projectReducer(state = initialState, action) {
              switch (action.type) {
                case UPDATE_CLICKED_MAP_INFO:
                  return {...state,clickedMapInfo: action.payload.clickedMapInfo};
                default: return state;
              }
            }
            let reducers = (function createReducers(redux, keplerGl) {
              return redux.combineReducers({
                keplerGl: keplerGl.keplerGlReducer.initialState({
                  uiState: {readOnly: true,currentModal: null},
                  mapState: {
                    zoom: ${options.config.config?.mapState?.zoom || 2.2},
                    minZoom: 2.2,maxZoom: 10,
                    longitude: ${options.config.config?.mapState?.longitude || 0},
                    latitude: ${options.config.config?.mapState?.latitude || 0},
                    scrollZoom: false
                  },
                  mapStyle: {...${JSON.stringify(options.config.config.mapStyle)},
                  mapStyles: ${JSON.stringify(options.mapStyle)}},
                }),
                project: projectReducer,
              });
            }(Redux, KeplerGl));
            function interceptKeplerActionsMiddlware({ getState, dispatch }) {
              return (next) => (action) => {
                let returnValue = next(action);
                if (action.type === "@@kepler.gl/LAYER_CLICK") dispatch({type: UPDATE_CLICKED_MAP_INFO,payload: { clickedMapInfo: action.payload.info }});
                return returnValue;
              };
            }
            
            let middleWares = (function createMiddlewares(keplerGl) {
              return keplerGl.enhanceReduxMiddleware([interceptKeplerActionsMiddlware]);
            }(KeplerGl));
            let enhancers = (function craeteEnhancers(redux, middles) {
              return redux.applyMiddleware(...middles);
            }(Redux, middleWares));
            let store = (function createStore(redux, enhancers) {
              let initialState = {};
              return redux.createStore(
                reducers,
                initialState,
                redux.compose(enhancers)
              );
            }(Redux, enhancers));
            /** END STORE **/

            /** COMPONENTS **/
            function makeApp(react, keplerGl) {
              function KeplerComponent() {
                let rootElm = react.useRef(null);
                let [windowDimension, setWindowDimension] = react.useState({
                  width: window.innerWidth,
                  height: window.innerHeight
                });
                let [feature, setFeature] = react.useState();
                const [tempUnit, setTempUnit]= react.useState('${
                  options.mapStyleConfigs.tempUnit
                }');
                const [precipitationUnit, setPrecipitationUnit]= react.useState('${
                  options.mapStyleConfigs.precipitationUnit
                }');
                let mapRef = react.useRef(null);
                let tippyInstanceRef = react.useRef(null);
                let clickedMapInfo = ReactRedux.useSelector(function(state){return state.project.clickedMapInfo});
                let mapState = ReactRedux.useSelector(function(state){return state.keplerGl["pf-map"]?.mapState});
                
                const tippyCoordinate = react.useMemo(function(){
                  if (window.viewportMercatorProject && feature) {
                    const viewport = new window.viewportMercatorProject(mapState);
                    return getCoordinate(viewport, [feature.longitude, feature.latitude]);
                  }
                }, [feature, mapState, window.viewportMercatorProject]);
                
                const checkEdgeCaseForPrecipitationBinsAfterConvertingToInch = (value) => {
                  if (value === -51 || value === -26) {
                    return convertmmToin(value) - 0.1;
                  }
                  return convertmmToin(value);
                };

                // handle key toggle change
                react.useEffect(() => {
                  let isChecked;
                  if (isTempMap) {
                    isChecked = tempUnit === "°F";
                  } else {
                    isChecked = precipitationUnit === "in";
                  }
                  dataset.binHexColors.map(function (color, index) {
                    const [from, to] = getBinLabel(
                      dataset.stops,
                      index,
                      dataset.dataset.pfDatasetUnitByUnit.unitLong,
                      dataset.dataset.minValue,
                      dataset.dataset.maxValue,
                      dataset.dataset.unit === "mm" && precipitationUnit === "in"
                        ? 0.1
                        : dataset.step,
                      tempUnit,
                      dataset.isDiff,
                      isFrequent,
                      precipitationUnit,
                      isPrecipitationMap
                    );
                    const innerBinSpan = document.getElementsByClassName(
                      "map-key-inner-bin-label"
                    )[index];
                    if (innerBinSpan) {
                      while (innerBinSpan.firstChild) {
                        innerBinSpan.removeChild(innerBinSpan.firstChild);
                      }
                      const fromText = document.createTextNode(from);
                      innerBinSpan.appendChild(fromText);
                      if (to !== undefined) {
                        const toText = document.createTextNode(to);
                        const dashSpan = document.createElement("span");
                        dashSpan.textContent = "-";
                        innerBinSpan.appendChild(dashSpan);
                        innerBinSpan.appendChild(toText);
                      }
                    }
                  });
                  const toggleOptionLeft =
                    document.getElementById("toggle-option1");
                  if(toggleOptionLeft) {
                    if (isChecked) toggleOptionLeft.style.color = "#2a172d";
                    else toggleOptionLeft.style.color = "#fdfdfd";
                  }
    
                  const toggleOptionRight =
                    document.getElementById("toggle-option2");
                  if(toggleOptionRight) {
                    if (isChecked) toggleOptionRight.style.color = "#fdfdfd";
                    else toggleOptionRight.style.color = "#2a172d";
                  }
                }, [tempUnit, precipitationUnit]);

                const handleToggleChange = react.useCallback(() => {
                  if (isTempMap) {
                    setTempUnit((tempUnit) => (tempUnit === "°C" ? "°F" : "°C"));
                  } else {
                    setPrecipitationUnit(precipitationUnit => precipitationUnit === "mm" ? "in" : "mm");
                  }
                }, [setTempUnit, setPrecipitationUnit]);
    
                react.useEffect(() => {
                  ${displayBottomLinkFunction}
                  ${displayClimateZonesKey}
                  ${displayKeyToggleFunction}
                  ${displayKeyFunction}
                  if (dataset.dataset.unit === "class") displayClimateZoneKey();
                  else displayKey();
                  displayBottomLink();
                }, [tempUnit, precipitationUnit]);
                
                react.useEffect(function(){
                  if(mapRef?.current && feature) {
                    let map = mapRef.current.getMap();
                    let keplerGlElement = document.getElementsByClassName('kepler-gl');
                    let container = keplerGlElement && keplerGlElement[0] ? keplerGlElement[0] : document.body;
                    let {selectedData} = feature;
                    let isFrequent = dataset.dataset.unit === "x as frequent";
                    let showBaselineDetails = dataset.isDiff && degrees !== 0 && !isFrequent;
                    let showInF = dataset.dataset.pfDatasetUnitByUnit.unitLong.toLowerCase().includes("temp") && tempUnit === "°F";
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
                    } else {
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
                      let showMidValueLabel = !dataset.isDiff || lowValue !== undefined || highValue !== undefined;
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
                        if (dataset.binLabels) return getLabelByValue(value,dataset.binningType,dataset.binLabels,dataset.stops);
                        else if (getter) return getter();
                        return showBaselineDetails && value > 0 ? \`+\${value}\` : value;
                      }
                      let popoverContent = "<div class='popover-row-container'>";
                      let fontSize = dataset.binLabels ? "14px;" : "20px;";
                      let fontSizeMid = dataset.binLabels ? "24px;" : "40px;";
                      let valueMargin = dataset.binLabels ? "10px 0 4px;" : "18px 0 4px;";
                      if(lowValue !== undefined) popoverContent += \`<div class="popover-value-container"><span style="font-size:\${fontSize};margin:\${valueMargin}" class="popover-value">\${getValue(lowValue)}</span><span class="popover-label">\${dataset.dataLabels[0]}</span></div>\`;
                      if(meanValue !== undefined) {
                        popoverContent += "<div class='popover-value-container'>";
                        if (isFrequent && meanValue < 1) popoverContent += "<span class='popover-mean-frequency-text'>Less frequent</span>";
                        else popoverContent += \`<span style="font-size:\${fontSizeMid}" class="popover-avg-value">\${getValue(meanValue, getMidValue)}</span>\`
                        if(showMidValueLabel) popoverContent+= \`<span class="popover-label">\${dataset.dataLabels[1]}</span>\`;
                        popoverContent += "</div>";
                      }
                      if(highValue !== undefined) popoverContent += \`<div class="popover-value-container"><span style="font-size:\${fontSize};margin:\${valueMargin}" class="popover-value">\${getValue(highValue)}</span><span class="popover-label">\${dataset.dataLabels[2]}</span></div>\`;
                      popoverContent += "</div>";
                      result += popoverContent;
                    }
                    result += "<button id='tippy-close-button' type='button' aria-label='Close popup' aria-hidden='true'>×</button>";
                    result += "</div>";
                    const tippyProps = {
                      zIndex:0,
                      interactive: true,
                      ignoreAttributes: true,
                      getReferenceClientRect: () => createVirtualReference(container, tippyCoordinate?.x, tippyCoordinate?.y),
                      placement: 'bottom',
                      offset: [0, 10],
                      appendTo: container,
                      allowHTML: true,
                      showOnCreate: true,
                      theme: 'light',
                      trigger: 'click',
                      hideOnClick: false,
                      popperOptions: {
                        placement: "bottom",
                        modifiers: [
                          { name: "preventOverflow", enabled: false },
                          { name: "flip", enabled: false },
                        ],
                      },
                      content: result,
                      onShown: function(instance) {
                        const closeBtn = document.getElementById("tippy-close-button");
                        if(closeBtn) {
                          closeBtn.onclick = function() {
                            instance.destroy();
                            if(tippyInstanceRef.current) {tippyInstanceRef.current.destroy();tippyInstanceRef.current = null;setFeature(undefined);}
                          }
                        }
                      },
                      onAfterUpdate: function(instance) {
                        const closeBtn = document.getElementById("tippy-close-button");
                        if(closeBtn) {
                          closeBtn.onclick = function() {
                            instance.destroy();
                            if(tippyInstanceRef.current) {tippyInstanceRef.current.destroy();tippyInstanceRef.current = null;setFeature(undefined);}
                          }
                        }
                      },
                    }
                    if(tippyInstanceRef.current) {tippyInstanceRef.current.setProps(tippyProps); tippyInstanceRef.current.show()}
                    else tippyInstanceRef.current = tippy(container, {...tippyProps})
                  }
                }, [feature, mapRef, tippyCoordinate, tempUnit, precipitationUnit])
                react.useEffect(function(){
                  if (mapRef.current && clickedMapInfo?.x && clickedMapInfo?.y && clickedMapInfo?.lngLat) {
                    let mapBoxMap = mapRef.current.getMap();
                    let [longitude, latitude] = clickedMapInfo.lngLat;
                    let { x, y } = clickedMapInfo;
                    let features = mapBoxMap.queryRenderedFeatures([x, y]);
                    let dataFeature = getFeature(features, longitude, latitude, x, y, dataKey);
                    setFeature(dataFeature);
                  }
                }, [clickedMapInfo, dataKey, mapRef]);
                react.useEffect(function() {
                  function handleResize() {
                    setWindowDimension({width: window.innerWidth, height: window.innerHeight});
                  };
                  window.addEventListener('resize', handleResize);
                  return function() {window.removeEventListener('resize', handleResize);};
                }, []);
                function updateMapStyles () {
                  let map = mapRef.current.getMap();
                  let { layers } = map?.getStyle();
                  layers.forEach(function(layer) {
                    let { id, type } = layer;
                    if (id.includes('region-')) {
                      map?.setPaintProperty(id, "fill-color", dataLayerPaintProperties);
                      map?.setPaintProperty(id, "fill-antialias", ["step", ["zoom"], false, 6, true]);
                      map?.setPaintProperty(id, "fill-outline-color", "#ffffff");
                    } else if (id.includes("boundary")) {
                      map.setLayoutProperty(id, "visibility", showBorders ? "visible" : "none");
                    } else if (type === "symbol" || id.includes("road")) {
                      map.setLayoutProperty(id, "visibility", showLabels ? "visible" : "none");
                    }
                  });
                }
                function getMapboxRef(ref) {
                  if (ref && !mapRef.current) {
                    mapRef.current = ref;
                    let map = mapRef.current.getMap();
                    map.on("style.load", () => updateMapStyles());
                  }
                };
                return react.createElement(
                  'div',
                  {style: {position: 'absolute', left: 0, width: '100%', height: '100%'}},
                  react.createElement(keplerGl.KeplerGl, {
                    mapboxApiAccessToken: '${options.mapboxAccessToken}',
                    id: "pf-map",
                    width: "100%",
                    height: "100%",
                    getMapboxRef: getMapboxRef
                  })
                )
              }
              function ControlsComponent() {
                function handleZoomInClick() {
                  let zoom = store.getState()?.keplerGl['pf-map']?.mapState?.zoom || 2.2;
                  if (zoom + 1 <= 10) store.dispatch(KeplerGl.updateMap({ zoom: zoom + 1 }));
                  else store.dispatch(KeplerGl.updateMap({ zoom: 10 }));
                }
    
                function handleZoomOutClick () {
                  let zoom = store.getState()?.keplerGl['pf-map']?.mapState?.zoom || 2.2;
                  if (zoom - 1 >= 2.2) store.dispatch(KeplerGl.updateMap({ zoom: zoom - 1 }));
                  else store.dispatch(KeplerGl.updateMap({ zoom: 2.2 }));
                }
    
                return React.createElement(
                    'div',
                    { className: 'zoom-button-container' },
                    React.createElement('button',
                        { id: 'zoom-in', className: 'zoom-button', title: 'Zoom in', onClick: handleZoomInClick },
                        React.createElement('svg',
                            { width: '12', height: '12', xmlns: 'http://www.w3.org/2000/svg' },
                            React.createElement('path', { d: 'M10.5 4.5h-3v-3a1.5 1.5 0 0 0-3 0l.053 3H1.5a1.5 1.5 0 0 0 0 3l3.053-.053L4.5 10.5a1.5 1.5 0 0 0 3 0V7.447l3 .053a1.5 1.5 0 0 0 0-3Z',
                                fill: '#1B1A1C', fillRule: 'nonzero'})
                        )
                    ),
                    React.createElement('button',
                        { id: 'zoom-out', className: 'zoom-button', title: 'Zoom out', onClick: handleZoomOutClick, },
                        React.createElement( 'svg',
                            { width: '12', height: '3', xmlns: 'http://www.w3.org/2000/svg',},
                            React.createElement('path', { d: 'M10.5 0h-9a1.5 1.5 0 0 0 0 3h9a1.5 1.5 0 0 0 0-3Z', fill: '#1B1A1C', fillRule: 'nonzero',})
                        )
                    )
                );
              }
              return {KeplerComponent, ControlsComponent};
            }
            function createReactReduxProvider(react, reactRedux) {
              let App = makeApp(react, KeplerGl);
              return react.createElement(
                reactRedux.Provider,
                {store},
                react.createElement(App.KeplerComponent, null),
                react.createElement(App.ControlsComponent, null)
              )
            }
            let app = createReactReduxProvider(React, ReactRedux);
            /** END COMPONENTS **/

            /** Render **/
            (function render(react, reactDOM, app) {
              reactDOM.render(app, document.getElementById('app'));
            }(React, ReactDOM, app));
            (function customize(keplerGl, store) {
              let datasets = ${JSON.stringify(options.datasets)};
              let config = ${JSON.stringify(options.config)};
              let loadedData = keplerGl.KeplerGlSchema.load(datasets, config);
              store.dispatch(keplerGl.addDataToMap({
                datasets: loadedData.datasets,
                config: loadedData.config,
                options: {keepExistingConfig: true,centerMap: false}
              }));
              let zoom = store.getState()?.keplerGl['pf-map']?.mapState?.zoom;
              if (!isNaN(zoom) && zoom < 2.2) store.dispatch(keplerGl.updateMap({ zoom: 2.2 }));
            }(KeplerGl, store));
          })();
        </script>
      </body>
    </html>
  `;
};
