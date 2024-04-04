import {
  compose,
  combineReducers,
  createStore,
  ThunkAction,
  Action,
  applyMiddleware,
} from "@reduxjs/toolkit";
// @ts-ignore
import keplerGlReducer from "kepler.gl/reducers";
// @ts-ignore
import { enhanceReduxMiddleware } from "kepler.gl/middleware";
import { consts } from "@probable-futures/lib";

import { MAP_ID } from "consts/MapConsts";
import { getDefaultInteraction } from "../utils";
import interceptKeplerActionsMiddlware from "./interceptKeplerActionsMiddlware";
import projectReducer, { ProjectState } from "./reducers/projectReducer";

const defaultViewState = {
  longitude: 0,
  latitude: 0,
  zoom: consts.INITIAL_ZOOM,
};

const keplerReducerInitialState = () => {
  const { zoom, longitude, latitude } =
    consts.getInitialMapViewState(window.location.hash.replace("#", "")) || defaultViewState;

  return {
    mapState: {
      zoom,
      minZoom: consts.MIN_ZOOM,
      maxZoom: consts.MAX_ZOOM,
      latitude,
      longitude,
    },
    uiState: {
      // hide add data modal when kepler mounts.
      currentModal: null,
    },
    visState: {
      interactionConfig: { ...getDefaultInteraction() },
    },
  };
};

type Reducer = {
  keplerGl: {
    [MAP_ID]: any;
  };
  project: ProjectState;
};

// @ts-ignore
const customizedKeplerGlReducer = keplerGlReducer.initialState(keplerReducerInitialState()).plugin({
  HIDE_SIDE_BAR: (state: any, action: any) => {
    return {
      ...state,
      uiState: {
        ...state.uiState,
        readOnly: true,
      },
    };
  },
});

const middlewares = enhanceReduxMiddleware([interceptKeplerActionsMiddlware]);
const enhancers = [applyMiddleware(...middlewares)];

const reducers = combineReducers<Reducer>({
  keplerGl: customizedKeplerGlReducer,
  project: projectReducer,
});

// @ts-ignore
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export const store = createStore(reducers, {}, composeEnhancers(...enhancers));

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
