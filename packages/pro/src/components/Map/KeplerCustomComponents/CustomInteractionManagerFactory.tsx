import React, { useEffect, useMemo, useState } from "react";
import { InteractionManagerFactory, PanelMeta } from "@kepler.gl/components";
import styled from "styled-components";
import { components, contexts } from "@probable-futures/components-lib";
import { UIStateActions, VisStateActions } from "@kepler.gl/actions";
import { Layer, LayerClassesType } from "@kepler.gl/layers";
import {
  ColorUI,
  InteractionConfig,
  LayerBaseConfig,
  LayerVisConfig,
  NestedPartial,
} from "@kepler.gl/types";
import { Datasets } from "@kepler.gl/table";

import CustomInteractionPanelFactory from "./CustomInteractionPanelFactory";
import { LayerConfigurator } from "./CustomLayerConfigurator";
import { colors } from "../../../consts";
import { EmptyFactory, StyledDivider } from "../../Common";
import { supportLayerTypes } from "../../../consts/MapConsts";
import BaseMapStyles from "../MapStyle/Binning/BaseMapStyles";
import { useAppSelector } from "../../../app/hooks";
import { useMapData } from "../../../contexts/DataContext";
import useProjectUpdate from "../../../utils/useProjectUpdate";
import { TabTitle } from "../../../shared/styles/styles";

const StyledInteractionManagerContainer = styled.div`
  overflow-y: scroll;
  overflow-x: hidden;
  position: relative;
  height: calc(100vh - 180px);
  width: 279px;
  padding-right: 14px;
  position: relative;

  ::-webkit-scrollbar-track {
    background: ${colors.secondaryBlack};
  }
  ::-webkit-scrollbar-thumb {
    border: 1px solid ${colors.grey};
    background-color: #d8d8d8;
  }
  ::-webkit-scrollbar {
    width: 2px;
  }
  .list__item__anchor {
    color: ${colors.primaryWhite};
  }
  .interaction-panel__header {
    background-color: ${colors.darkPurpleBackground};
  }
  .side-panel-panel__content {
    background-color: ${colors.darkPurpleBackground};
  }
  .interaction-manager {
    .interaction-panel {
      padding-bottom: 0px;
    }
  }
  .layer-manager {
    .side-panel-divider {
      display: none;
    }
  }
  .layer-manager > .side-panel-section {
    margin-bottom: 0px;

    &:last-child {
      display: none;
    }
  }
  .add-layer-button {
    display: none;
  }
  .layer-panel {
    margin-bottom: 0px;
  }
`;

const MainWrapper = styled.div`
  position: relative;
`;

const BinningWrapper = styled.div`
  > div:first-child {
    padding: 12px;
  }
`;

const StyledPlaceholder = styled.div`
  color: ${colors.midGrey};
  font-size: 16px;
  padding: 24px 16px;
`;

type InteractionManagerProps = {
  interactionConfig: InteractionConfig;
  datasets: Datasets;
  visStateActions: typeof VisStateActions;
  uiStateActions: typeof UIStateActions;
  panelMetadata: PanelMeta;
  layers: Layer[];
  layerOrder: string[];
  layerClasses: LayerClassesType;
};

function CustomInteractionManagerFactory(...deps: Parameters<typeof InteractionManagerFactory>) {
  const InteractionManager = InteractionManagerFactory(...deps);

  const CustomInteractionManager = (props: InteractionManagerProps) => {
    const primaryLayer = props.layers.length > 0 ? props.layers[0] : null;
    const primaryDatasetId = primaryLayer?.config?.dataId;
    const primaryDataset = primaryDatasetId ? props.datasets[primaryDatasetId] : null;

    const { selectedClimateData } = useMapData();
    const bins =
      useAppSelector((state) => state.project.mapConfig?.pfMapConfig?.bins) ||
      selectedClimateData?.stops;
    const [mapBins, setMapbins] = useState<number[]>(bins || []);
    const { updateProject } = useProjectUpdate();

    const onCommitChange = () =>
      updateProject({ mapStyleConfig: { key: "bins", value: [...mapBins] } });

    useEffect(() => {
      // by default the point layer is not visible.
      // turn on the layers that have distinct dataId and are of type point or heatmap
      if (props.visStateActions && props.layers && props.layers.length) {
        const dataIdsSet = new Set<string>();
        const maxActiveLayers = Object.keys(props.datasets).length;
        let currentActiveLayers = props.layers.filter(
          (layer: Layer) =>
            layer.type && supportLayerTypes.includes(layer.type) && layer.config.isConfigActive,
        ).length;
        props.layers.forEach((layer: any) => {
          if (
            layer.config.dataId &&
            !dataIdsSet.has(layer.config.dataId) &&
            supportLayerTypes.includes(layer.type) &&
            maxActiveLayers > currentActiveLayers
          ) {
            props.visStateActions.layerConfigChange(layer, { isConfigActive: true });
            dataIdsSet.add(layer.config.dataId);
            currentActiveLayers++;
          }
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const layerTypeOptions = useMemo(
      () =>
        Object.keys(props.layerClasses).map((key) => {
          // @ts-ignore
          const layer = new props.layerClasses[key]({ dataId: "" });
          return {
            id: key,
            label: layer.name,
            icon: layer.layerIcon,
            requireData: layer.requireData,
          };
        }),
      [props.layerClasses],
    );

    if (!primaryLayer || !primaryDataset) {
      return (
        <MainWrapper>
          <TabTitle>Map Style</TabTitle>
          <StyledInteractionManagerContainer>
            <StyledPlaceholder>Loading map data…</StyledPlaceholder>
          </StyledInteractionManagerContainer>
        </MainWrapper>
      );
    }

    const updateLayerConfig = (newProp: Partial<LayerBaseConfig>) => {
      props.visStateActions.layerConfigChange(primaryLayer, newProp);
    };

    const updateLayerType = (newType: string) => {
      props.visStateActions.layerTypeChange(primaryLayer, newType);
    };

    const updateLayerVisConfig = (newVisConfig: Partial<LayerVisConfig>) => {
      props.visStateActions.layerVisConfigChange(primaryLayer, newVisConfig);
    };

    const updateLayerColorUI = (...args: [string, NestedPartial<ColorUI>]) => {
      props.visStateActions.layerColorUIChange(primaryLayer, ...args);
    };

    const updateLayerTextLabel = (...args: [number | "all", string, any]) => {
      props.visStateActions.layerTextLabelChange(primaryLayer, ...args);
    };

    const updateLayerVisualChannelConfig = (
      newConfig: Partial<LayerBaseConfig>,
      channel: string,
      newVisConfig?: Partial<LayerVisConfig>,
    ) => {
      props.visStateActions.layerVisualChannelConfigChange(
        primaryLayer,
        newConfig,
        channel,
        newVisConfig,
      );
    };

    return (
      <MainWrapper>
        <TabTitle>Map Style</TabTitle>
        <StyledInteractionManagerContainer>
          <LayerConfigurator
            layer={primaryLayer}
            datasets={props.datasets}
            layerTypeOptions={layerTypeOptions}
            openModal={props.uiStateActions.toggleModal}
            updateLayerConfig={updateLayerConfig}
            updateLayerType={updateLayerType}
            updateLayerVisConfig={updateLayerVisConfig}
            updateLayerVisualChannelConfig={updateLayerVisualChannelConfig}
            updateLayerColorUI={updateLayerColorUI}
            updateLayerTextLabel={updateLayerTextLabel}
          />

          <StyledDivider />
          <div>
            {primaryLayer && primaryLayer.type !== "heatmap" && <InteractionManager {...props} />}
            {props.layers && props.layers.length > 0 && <StyledDivider />}

            <BinningWrapper>
              <contexts.ThemeProvider theme="dark">
                <components.Binning
                  mapBins={mapBins}
                  bins={bins}
                  binHexColors={selectedClimateData?.binHexColors}
                  selectedDataset={selectedClimateData}
                  onCommitChange={onCommitChange}
                  setMapbins={(bins) => setMapbins(bins)}
                  isPro={true}
                  title="Binning"
                />
              </contexts.ThemeProvider>
            </BinningWrapper>
            <BaseMapStyles />
          </div>
        </StyledInteractionManagerContainer>
      </MainWrapper>
    );
  };
  return CustomInteractionManager;
}

CustomInteractionManagerFactory.deps = [CustomInteractionPanelFactory, EmptyFactory];

export default CustomInteractionManagerFactory;
