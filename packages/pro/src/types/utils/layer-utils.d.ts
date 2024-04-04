import { Layer, LayerClassesType } from "layers";
import { VisState, Dataset, TooltipField, CompareType } from "reducers/vis-state-updaters";

export function calculateLayerData(
  layer: Layer,
  state: VisState,
  oldLayerData?: any,
): {
  layerData: any;
  layer: Layer;
};

export type LayersToRender = {
  [layerId: string]: boolean;
};

export type LayerHoverProp = {
  data: any[];
  fields: Field[];
  fieldsToShow: TooltipField[];
  layer: Layer;
  primaryData?: any[];
  compareType?: CompareType;
};

export function findDefaultLayer(dataset: Dataset, layerClasses: LayerClassesType): Layer[];
export function getLayerHoverProp(arg: {
  interactionConfig: VisState["interactionConfig"];
  hoverInfo: VisState["hoverInfo"];
  layers: VisState["layers"];
  layersToRender: LayersToRender;
  datasets: VisState["datasets"];
}): LayerHoverProp | null;

export function renderDeckGlLayer(props: any, layerCallbacks: { [key]: any }, idx: number);
