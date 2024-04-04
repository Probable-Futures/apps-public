import React, { useEffect, useState } from "react";
import {
  InteractionManagerFactory,
  // @ts-ignore
} from "kepler.gl/components";
import styled from "styled-components";
import { components, contexts } from "@probable-futures/components-lib";

import CustomInteractionPanelFactory from "./CustomInteractionPanelFactory";
import CustomLayerManagerFactory from "./CustomLayerManagerFactoryForMapStyle";
import { colors } from "../../../consts";
import { StyledDivider } from "../../Common";
import { supportLayerTypes } from "../../../consts/MapConsts";
import BaseMapStyles from "../MapStyle/Binning/BaseMapStyles";
import { useAppSelector } from "../../../app/hooks";
import { useMapData } from "../../../contexts/DataContext";
import useProjectUpdate from "../../../utils/useProjectUpdate";

const StyledInteractionManagerContainer = styled.div`
  overflow-y: scroll;
  overflow-x: hidden;
  position: relative;
  height: 100vh;
  width: 279px;
  padding-right: 14px;
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

const BinningWrapper = styled.div`
  > div:first-child {
    padding: 12px;
  }
`;

type InteractionManagerProps = {
  interactionConfig: any;
  datasets: any;
  visStateActions: any;
  layers: any;
};

function CustomInteractionManagerFactory(...deps: any) {
  const InteractionManager = InteractionManagerFactory(...deps);
  const LayerManagerFactory = CustomLayerManagerFactory();

  const CustomInteractionManager = (props: InteractionManagerProps) => {
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
          (layer: any) => supportLayerTypes.includes(layer.type) && layer.config.isConfigActive,
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

    return (
      <StyledInteractionManagerContainer>
        <LayerManagerFactory {...props} />
        <StyledDivider />
        <div>
          {props.layers[0] && props.layers[0].type !== "heatmap" && (
            <InteractionManager {...props} />
          )}
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
    );
  };
  return CustomInteractionManager;
}

CustomInteractionManagerFactory.deps = [CustomInteractionPanelFactory];

export default CustomInteractionManagerFactory;
