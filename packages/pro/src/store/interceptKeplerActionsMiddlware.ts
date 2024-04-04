import { UPDATE_PROJECT_SYNCED, UPDATE_CLICKED_MAP_INFO } from "./actions";

const keplerActions = [
  "@@kepler.gl/LAYER_VISUAL_CHANNEL_CHANGE",
  "@@kepler.gl/ADD_FILTER",
  "@@kepler.gl/REMOVE_FILTER",
  "@@kepler.gl/SET_FILTER",
  "@@kepler.gl/LAYER_TYPE_CHANGE",
  "@@kepler.gl/LAYER_COLOR_UI_CHANGE",
  "@@kepler.gl/LAYER_VIS_CONFIG_CHANGE",
  "@@kepler.gl/INTERACTION_CONFIG_CHANGE",
  "@@kepler.gl/LAYER_CONFIG_CHANGE",
  "@@kepler.gl/MAP_CONFIG_CHANGE",
];

export default function interceptKeplerActionsMiddlware({ getState, dispatch }: any) {
  return (next: any) => (action: any) => {
    const returnValue = next(action);

    if (keplerActions.find((keplerAction) => keplerAction === action.type)) {
      dispatch({ type: UPDATE_PROJECT_SYNCED, payload: { isSynced: false } });
    }

    if (action.type === "@@kepler.gl/LAYER_CLICK") {
      dispatch({
        type: UPDATE_CLICKED_MAP_INFO,
        payload: { clickedMapInfo: action.payload.info },
      });
    }

    return returnValue;
  };
}
