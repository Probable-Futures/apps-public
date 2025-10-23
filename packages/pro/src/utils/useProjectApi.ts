import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { addDataToMap, interactionConfigChange, reorderLayer } from "@kepler.gl/actions";
import KeplerGlSchema from "@kepler.gl/schemas";
import debounce from "lodash.debounce";
import { types, utils } from "@probable-futures/lib";
import { ParsedConfig, ParsedLayer, ProtoDataset, InteractionConfig } from "@kepler.gl/types";
import { KeplerGlState } from "@kepler.gl/reducers";
import { Layer } from "@kepler.gl/layers";

import { CREATE_PARTNER_PROJECT } from "../graphql/queries/projects";
import {
  cleanKeplerConfig,
  findDataId,
  getDefaultTooltipFields,
  MapConfig,
  mergeLayers,
  Project,
} from "./projectHelper";
import { PROJECT_QUERY_PARAM, PROJECT_SHARE_ID_QUERY_PARAM } from "../consts/dashboardConsts";
import {
  CLEAR_DATASET_ENRICHMENT,
  SET_ADDED_DATA_TO_MAP,
  SET_ADDING_NEW_DATASET,
  SET_SLUG_ID,
  UPDATE_PROJECT_SYNCED,
} from "../store/actions";
import { buildMapStylesObject } from "./useMapActions";
import { MAP_ID } from "../consts/MapConsts";
import { useMapData } from "../contexts/DataContext";
import useDatasetFilter from "./useDatasetFilter";
import useProjectUpdate from "./useProjectUpdate";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import useProjectInit from "./useProjectInit";
import { initialState } from "../store/reducers/projectReducer";

type Props = {
  degrees: number;
  percentileValue: utils.BinningType;
  setDefaultColorField: (layers: Layer[], dataId?: string) => void;
};

export type PartnerDataset = {
  name: string;
  url: string;
};

type ProjectResponse = {
  createPartnerProject: {
    pfPartnerProject: Project;
  };
};

export type AddDataToMapPayloadSimplified = {
  datasets: ProtoDataset[] | ProtoDataset;
  config?: ParsedConfig;
};

const useProjectApi = ({ setDefaultColorField, degrees, percentileValue }: Props) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { keplerGl, project } = useAppSelector((state) => state);
  const { updateProject } = useProjectUpdate();
  const { selectedClimateData, setShowMergeDataModal } = useMapData();
  const [createPartnerProject] = useMutation<ProjectResponse>(CREATE_PARTNER_PROJECT);
  const projectDataRef = useRef({
    filteredProjectDatasets: project.filteredProjectDatasets,
    addedDataToMap: project.addedDataToMap,
    imageUrl: project.imageUrl,
    mapConfig: project.mapConfig,
    slugId: project.slugId,
    addingNewDataset: project.addingNewDataset,
  });
  const keplerRef = useRef<KeplerGlState>();
  const selectedClimateDataRef = useRef<types.Map>();

  const { fetchProject } = useProjectInit();

  const datasetsCount = useMemo(() => {
    let count = 0;
    if (keplerGl[MAP_ID]) {
      count = Object.keys(keplerGl[MAP_ID].visState.datasets).length;
    }
    return count;
  }, [keplerGl]);

  const getSchemaConfig = useCallback(() => {
    let mapConfig: MapConfig = {
      pfMapConfig: { ...initialState.mapConfig.pfMapConfig },
    };
    if (keplerRef.current) {
      mapConfig = {
        pfMapConfig: mapConfig.pfMapConfig,
        keplerConfig: KeplerGlSchema.getConfigToSave(keplerRef.current),
      };
    }
    return mapConfig;
  }, []);

  const updateKeplerConfig = useCallback(() => {
    updateProject({
      keplerConfig: getSchemaConfig().keplerConfig,
    });
    dispatch({ type: UPDATE_PROJECT_SYNCED, payload: { isSynced: true } });
  }, [dispatch, updateProject, getSchemaConfig]);

  const createProject = useCallback(
    async (name: string, description: string, pfDatasetId: number) => {
      const { data } = await createPartnerProject({
        variables: {
          name,
          description,
          pfDatasetId,
        },
      });
      const project = data?.createPartnerProject.pfPartnerProject;
      if (project) {
        fetchProject(project.id, false);
        window.history.replaceState(null, "", `?${PROJECT_QUERY_PARAM}=${project.id}`);
      }
      return project;
    },
    [createPartnerProject, fetchProject],
  );

  const setDefaultConfig = useCallback(
    (applyToAll: boolean) => {
      if (!keplerRef.current) {
        return;
      }
      if (applyToAll) {
        setDefaultColorField(keplerRef.current.visState.layers);
      } else {
        const dataIds = Object.keys(keplerRef.current.visState.datasets);
        setDefaultColorField(keplerRef.current.visState.layers, dataIds[dataIds.length - 1]);
      }
      const interactionConfig: InteractionConfig = keplerRef.current.visState.interactionConfig;
      const tooltipConfig = {
        ...interactionConfig.tooltip,
        fieldsToShow: getDefaultTooltipFields(interactionConfig.tooltip.config.fieldsToShow),
      };
      dispatch(interactionConfigChange(tooltipConfig));
    },
    [dispatch, setDefaultColorField],
  );

  useEffect(() => {
    projectDataRef.current = {
      filteredProjectDatasets: project.filteredProjectDatasets,
      addedDataToMap: project.addedDataToMap,
      imageUrl: project.imageUrl,
      mapConfig: project.mapConfig,
      slugId: project.slugId,
      addingNewDataset: project.addingNewDataset,
    };
  }, [
    project.filteredProjectDatasets,
    project.addedDataToMap,
    project.imageUrl,
    project.mapConfig,
    project.slugId,
    project.addingNewDataset,
  ]);

  useEffect(() => {
    selectedClimateDataRef.current = selectedClimateData;
  }, [selectedClimateData]);

  useEffect(() => {
    keplerRef.current = keplerGl[MAP_ID];
  }, [keplerGl]);

  useDatasetFilter({
    datasets: keplerGl[MAP_ID]?.visState?.datasets,
    filters: keplerGl[MAP_ID]?.visState?.filters,
    degrees,
    selectedClimateData,
    percentileValue,
    dispatch,
    isDataAdded: project.addedDataToMap,
    initializingProject: project.initializingProject,
    projectDatasets: project.projectDatasets,
    filteredProjectDatasets: project.filteredProjectDatasets,
  });

  // save projectId from url.
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get(PROJECT_QUERY_PARAM) || "";
    const slugId = queryParams.get(PROJECT_SHARE_ID_QUERY_PARAM) || "";
    if (!id && !slugId) {
      setShowMergeDataModal(true);
      dispatch({ type: SET_ADDED_DATA_TO_MAP, payload: { addedDataToMap: true } });
    }
    if (slugId) {
      dispatch({ type: SET_SLUG_ID, payload: { slugId } });
    } else if (id) {
      fetchProject(id, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Whenever isSynced is changed to false, call updateProject to preserve the changes.
   * isSynced is controlled by interceptKeplerActionsMiddlware
   */
  useEffect(() => {
    let callDebounce: any;
    if (!project.isSynced && project.addedDataToMap) {
      callDebounce = debounce(() => updateKeplerConfig(), 300);
      callDebounce();
    }
    return () => callDebounce && callDebounce.cancel();
  }, [project.addedDataToMap, project.isSynced, updateKeplerConfig]);

  useEffect(() => {
    const {
      current: {
        filteredProjectDatasets,
        addedDataToMap,
        mapConfig: configs,
        slugId,
        addingNewDataset,
      },
    } = projectDataRef;

    // Only proceed if we haven't added data yet or if we're adding a new dataset
    if (addedDataToMap && !addingNewDataset) {
      return;
    }
    const projectConfigs = configs;
    const mapConfig: MapConfig | undefined = projectConfigs
      ? JSON.parse(JSON.stringify(projectConfigs))
      : undefined;

    const getDatasets = (): ProtoDataset[] => {
      const datasets = keplerRef.current?.visState.datasets;
      if (datasets) {
        return Object.keys(datasets).map((key, index) => ({
          data: {
            fields: datasets[key].fields,
            //@ts-ignore
            rows: datasets[key].dataContainer._rows,
          },
          info: { ...datasets[key].metadata },
          // version: datasets[key].version,
          // info: {
          //   id: datasets[key].id,
          //   label: datasets[key].label,
          //   color: datasets[key].color,
          //   type: datasets[key].type,
          // },
        }));
      }
      return [];
    };

    const getKeplerConfig = (): AddDataToMapPayloadSimplified => {
      const schemaConfig = getSchemaConfig();
      const savedConf = mapConfig?.keplerConfig?.config as ParsedConfig | undefined;

      /**
       * This is needed when multiple datasets are in a project:
       * At first you would have on dataset which can have multiple layers
       * These layers are part of the config object we save in the db
       * A layer can be of type point and hold attributes like point color, radius..
       *
       * When a second dataset is added to the project??
       */
      const parsedLayers: ParsedLayer[] | undefined = mergeLayers(
        schemaConfig.keplerConfig?.config.visState?.layers,
        savedConf?.visState?.layers,
      );

      const conf: ParsedConfig = {
        ...schemaConfig.keplerConfig?.config,
        ...savedConf,
      } as ParsedConfig;

      return {
        datasets: getDatasets(),
        config: {
          ...{
            ...conf,
            visState: { ...conf.visState, layers: parsedLayers || conf.visState?.layers },
          },
          mapStyle: {
            mapStyles: buildMapStylesObject(selectedClimateDataRef.current),
          },
        },
      };
    };

    if (
      selectedClimateDataRef.current &&
      datasetsCount > 0 &&
      (slugId || datasetsCount === filteredProjectDatasets?.length)
    ) {
      // deep copy kepler's config to make the object writable
      const keplerConf: AddDataToMapPayloadSimplified = cleanKeplerConfig(
        JSON.parse(JSON.stringify(getKeplerConfig())),
      );
      /**
       * The enrichment process updates all columns in the CSV file to lower case.
       * As a result, if there was a filter that was set on a field before enrichment,
       * let's say on the "Cases2020" column, then we enrich and try to load the page,
       * the column Cases2020 becomes cases2020 in the dataset, however the filter is still
       * set over the field name Cases2020 which does not exist anymore causing an error.
       * So we change all the filters and columns to lower case to work in all situations.
       */
      if (Array.isArray(keplerConf.datasets)) {
        keplerConf.datasets.forEach((dataset) => {
          dataset.data.fields.forEach((field) => {
            field.name = field.name.toLowerCase().trim().replace(/ /g, "_");
          });
        });

        keplerConf.config?.visState?.filters?.forEach((filter) => {
          if (filter.name) {
            filter.name[0] = filter.name[0].toLowerCase().trim().replace(/ /g, "_");
          }
        });
      }

      // match the dataset id with dataId in the config objects
      if (Array.isArray(keplerConf.datasets) && keplerConf.config?.visState?.layers) {
        if (addingNewDataset) {
          setDefaultConfig(false);
          dispatch({
            type: SET_ADDING_NEW_DATASET,
            payload: { addingNewDataset: false },
          });
          if (!addedDataToMap) {
            dispatch({ type: SET_ADDED_DATA_TO_MAP, payload: { addedDataToMap: true } });
          }
          if (keplerRef.current?.visState?.layerOrder) {
            // move the added layer to the end.
            const newOrder = keplerRef.current.visState?.layerOrder;
            const firstLayerOrder = newOrder.shift();
            if (firstLayerOrder) {
              newOrder.push(firstLayerOrder);
              dispatch(reorderLayer(newOrder));
            }
          }
        } else {
          const dataId = findDataId(
            keplerConf.datasets.length,
            keplerConf.config.visState.layers,
          ).values();
          for (let i = 0; i < keplerConf.datasets.length; i++) {
            const dataset = keplerConf.datasets[i];
            dataset.info.id = dataId.next().value || dataset.info.id;
          }
          // set default config directly on the layer before sending the data to kepler
          if (!mapConfig?.keplerConfig) {
            keplerConf.config.visState.layers.forEach((layer) => {
              if (layer.type === "point") {
                layer.config.color = [0, 0, 0];
              }
            });
          }

          dispatch(
            addDataToMap({
              config: keplerConf.config,
              datasets: keplerConf.datasets,
              options: { centerMap: false },
            }),
          );
          // Re-adjust the zoom after data is loaded, otherwise it is gonna start at 0 regardless of the minZoom level.
          // dispatch(updateMap({ zoom: consts.MIN_ZOOM }));
          dispatch({
            type: CLEAR_DATASET_ENRICHMENT,
            payload: {},
          });
          if (!addedDataToMap) {
            dispatch({ type: SET_ADDED_DATA_TO_MAP, payload: { addedDataToMap: true } });
          }
        }
      }
    }
  }, [datasetsCount, dispatch, getSchemaConfig, setDefaultConfig]);

  return {
    createProject,
  };
};

export default useProjectApi;
