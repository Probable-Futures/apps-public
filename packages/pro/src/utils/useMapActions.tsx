import { useCallback, useEffect } from "react";
import {
  addDataToMap,
  layerVisualChannelConfigChange,
  layerConfigChange,
  updateMap,
} from "@kepler.gl/actions";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { consts, types } from "@probable-futures/lib";
import debounce from "lodash.debounce";
import { SavedCustomMapStyle } from "@kepler.gl/types";
import { Layer } from "@kepler.gl/layers";

import { AppDispatch } from "../store/store";
import { useMapData } from "../contexts/DataContext";
import { hideSideBar } from "../store/actions";
import { ProjectState } from "../store/reducers/projectReducer";
import { MAP_ID } from "../consts/MapConsts";

export const buildMapStylesObject = (climateData: types.Map | undefined): SavedCustomMapStyle => {
  if (!climateData || !climateData.dataset.slug) {
    return {};
  }
  return {
    [climateData.dataset.slug]: {
      id: climateData.dataset.slug,
      label: climateData.name,
      url: `mapbox://styles/probablefutures/${climateData.mapStyleId}`,
      icon: "https://api.maptiler.com/maps/voyager/256/0/0/0.png?key=ySQ0fIYn7eSl3ppOeEJd",
      accessToken: "",
      custom: false,
    },
  };
};

const useMapActions = ({
  dispatch,
  project,
  keplerGl,
}: {
  dispatch: AppDispatch;
  project: ProjectState;
  keplerGl: any;
}) => {
  const { climateData, selectedClimateData } = useMapData();
  const { isAuthenticated, isLoading } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Set default color field for point layers to null and color to black
   */
  const setDefaultColorField = useCallback(
    (layers: Layer[], datasetId?: string) => {
      if (layers && layers.length) {
        layers.forEach((layer) => {
          if (layer.type === "point" && layer.visualChannels && layer.visualChannels.color) {
            if (!datasetId || layer.config?.dataId === datasetId) {
              dispatch(
                layerVisualChannelConfigChange(
                  layer,
                  { [layer.visualChannels.color.field]: null },
                  layer.visualChannels.color.key,
                ),
              );
              dispatch(layerConfigChange(layer, { [layer.visualChannels.color.key]: [0, 0, 0] }));
            }
          }
        });
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (selectedClimateData) {
      const mapStyleObject = buildMapStylesObject(selectedClimateData);
      dispatch(
        addDataToMap({
          datasets: [],
          config: {
            mapStyle: { styleType: mapStyleObject[Object.keys(mapStyleObject)[0]].id },
          },
        }),
      );
    }
  }, [selectedClimateData, dispatch]);

  useEffect(() => {
    dispatch(
      addDataToMap({
        config: {
          mapStyle: {
            mapStyles: climateData.reduce((prev, data) => {
              return {
                ...prev,
                ...buildMapStylesObject(data),
              };
            }, {}),
          },
        },
        datasets: [],
      }),
    );
  }, [climateData, dispatch]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      dispatch(hideSideBar());
      if (location.pathname === "/map") {
        navigate("/");
      }
    }
  }, [dispatch, isAuthenticated, isLoading, navigate, location.pathname]);

  /**
   * After the data is added to the project, kepler readjusts the center of the map to the closest area to the data.
   * However, we need to override and recenter the map based on the hash values of the url, that is zoom, longitude and latitude.
   * So to achieve this, we check if the data is finished adding to the map and the hash params exist in the url, then we apply them.
   */
  useEffect(() => {
    if (project.addedDataToMap) {
      const initalMapView = consts.getInitialMapViewState(window.location.hash.replace("#", ""));
      if (initalMapView) {
        setTimeout(() => {
          dispatch(
            updateMap({
              longitude: initalMapView.longitude,
              latitude: initalMapView.latitude,
              zoom: initalMapView.zoom,
            }),
          );
        }, 100);
      }
    }
  }, [project.addedDataToMap, dispatch]);

  /**
   * Kepler does not automatically update the URL's hash after the zoom, longitude or latitude changes, so we need to handle this ourselves.
   * The hash values change so quickly when a user is dragging or zooming the map, so we use debounce to avoid changing the hash on every coordinates or zoom change.
   * We use setTimeout to force this hook to run after the hook above it, in order to prevent overriding the values in the hash
   */
  useEffect(() => {
    let callDebounce: any;
    const updateLocationHash = () => {
      const { zoom, latitude, longitude } = keplerGl[MAP_ID].mapState;
      if (zoom && latitude && longitude) {
        setTimeout(() => {
          window.location.hash =
            "#" + zoom.toFixed(2) + "/" + latitude.toFixed(2) + "/" + longitude.toFixed(2);
        }, 500);
      }
    };
    if (keplerGl[MAP_ID] && project.addedDataToMap) {
      callDebounce = debounce(() => updateLocationHash(), 300);
      callDebounce();
    }
    return () => callDebounce && callDebounce.cancel();
  }, [project.addedDataToMap, keplerGl]);

  return { setDefaultColorField };
};

export default useMapActions;
