import { LayerConfiguratorProps } from "../components/Map/KeplerCustomComponents/CustomLayerConfigurator";

export { parseCsvRows } from "./file";

export function toArray(item: any) {
  if (Array.isArray(item)) {
    return item;
  }

  if (typeof item === "undefined" || item === null) {
    return [];
  }

  return [item];
}

export const getLayerFields = (datasets: any, layer: any) =>
  layer.config && datasets[layer.config.dataId] ? datasets[layer.config.dataId].fields : [];

export const getVisConfiguratorProps = (props: LayerConfiguratorProps) => ({
  layer: props.layer,
  fields: getLayerFields(props.datasets, props.layer),
  onChange: props.updateLayerVisConfig,
  setColorUI: props.updateLayerColorUI,
});

export const getLayerConfiguratorProps = (props: LayerConfiguratorProps) => ({
  layer: props.layer,
  fields: getLayerFields(props.datasets, props.layer),
  onChange: props.updateLayerConfig,
  setColorUI: props.updateLayerColorUI,
});

export const getLayerChannelConfigProps = (props: LayerConfiguratorProps) => ({
  layer: props.layer,
  fields: getLayerFields(props.datasets, props.layer),
  onChange: props.updateLayerVisualChannelConfig,
});

const arrayMoveMutate = (array: Array<any>, from: number, to: number) => {
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
};

export const arrayMove = (array: Array<any>, from: number, to: number) => {
  array = array.slice();
  arrayMoveMutate(array, from, to);
  return array;
};

export function getDefaultInteraction() {
  return {
    tooltip: {
      id: "tooltip",
      label: "interactions.tooltip",
      enabled: true,
      config: {
        fieldsToShow: {},
        compareMode: false,
      },
    },
    geocoder: {
      id: "geocoder",
      label: "interactions.geocoder",
      enabled: false,
      position: null,
    },
    brush: {
      id: "brush",
      label: "interactions.brush",
      enabled: false,
      config: {
        // size is in km
        size: 0.5,
      },
    },
    coordinate: {
      id: "coordinate",
      label: "interactions.coordinate",
      enabled: true,
      position: null,
    },
  };
}

/**
 * https://stackoverflow.com/questions/17010119/decodeuri-decodes-space-as-symbol
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param {string} str The string to url decode.
 * @return {string} The decoded {@code str}.
 */
export const urlDecode = (str: string) => {
  return decodeURIComponent(str.replace(/\+/g, " "));
};

const countDigits = (n: number) => {
  let count = 0;
  if (n >= 1) {
    ++count;
  }

  while (n / 10 >= 1) {
    n /= 10;
    ++count;
  }

  return count;
};

export const bytesToString = (n: number): string => {
  let result = "";
  switch (countDigits(n)) {
    case 4:
    case 5:
    case 6:
      result = `${(n / 1024).toFixed(2)} KB`;
      break;
    case 7:
    case 8:
    case 9:
      result = `${(n / (1024 * 1024)).toFixed(2)} MB`;
      break;
    case 10:
    case 11:
    case 12:
      result = `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
      break;
    default:
      result = `${n} B`;
      break;
  }
  return result;
};
