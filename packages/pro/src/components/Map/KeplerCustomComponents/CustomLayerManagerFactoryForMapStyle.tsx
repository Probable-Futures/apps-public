//@ts-ignore
import { LayerManagerFactory, LayerPanelFactory } from "kepler.gl/components";
import styled from "styled-components";

import LayerColor from "../MapStyle/Point/LayerColor";
import LayerRadius from "../MapStyle/Point/LayerRadius";
import { EmptyFactory } from "../../Common";
import DatasetTitle from "../Common/DatasetTitle";
import { colors } from "../../../consts";
import LayerStroke from "../MapStyle/Point/LayerStroke";

type Props = {
  layer: any;
  datasets: any;
  layerTypeOptions: any;
  openModal: Function;
  updateLayerConfig: Function;
  updateLayerType: Function;
  updateLayerVisConfig: Function;
  updateLayerVisualChannelConfig: Function;
  updateLayerColorUI: Function;
};

const Container = styled.div`
  background-color: ${colors.darkPurpleBackground};
  padding: 0px 12px;
  margin-bottom: -12px;

  .kg-slider {
    div:first-child {
      height: 2px;
    }
  }

  .side-panel-section {
    background-color: ${colors.darkPurpleBackground};
    padding-top: 10px;
    padding-bottom: 10px;

    .range-slider__input-group {
      margin-top: 16px;
    }
  }

  .color-selector__selector {
    background-color: ${colors.secondaryBlack};
    border: 1px solid ${colors.darkGrey};

    :active {
      border: 1px solid ${colors.primaryWhite};
    }
  }

  .color-range-selector {
    border: 1px solid ${colors.darkGrey};
    background-color: #130e13;

    .color-palette__config {
      display: none;

      :nth-child(2) {
        display: flex;

        .color-palette__config__label::after {
          content: "# colors";
          color: ${colors.midGrey};
        }

        .side-panel-panel__label {
          display: none;
        }

        .color-palette__config__select {
          border: 1px solid ${colors.darkGrey};
          background-color: ${colors.black};
        }

        .list-selector {
          background-color: #130e13;

          ::-webkit-scrollbar {
            width: 3px;
          }

          ::-webkit-scrollbar-track {
            background: ${colors.secondaryBlack};
          }

          ::-webkit-scrollbar-thumb {
            border: 1px solid ${colors.grey};
            background-color: ${colors.primaryWhite};
          }
        }
      }
    }

    .item-selector .item-selector__dropdown {
      background-color: ${colors.black};
    }
  }

  .color-selector__dropdown {
    z-index: 10;

    ::-webkit-scrollbar {
      width: 3px;
    }

    ::-webkit-scrollbar-track {
      background: ${colors.secondaryBlack};
    }

    ::-webkit-scrollbar-thumb {
      border: 1px solid ${colors.grey};
      background-color: ${colors.primaryWhite};
    }
  }

  .side-panel-panel__label {
    color: ${colors.midGrey};
    font-family: LinearSans;
    font-size: 14px;
    letter-spacing: 0.23px;
    line-height: 16px;
  }

  .kg-range-slider__bar {
    background-color: ${colors.blue} !important;
    height: 2px;
  }

  .kg-range-slider__handle {
    border-radius: 50% !important;
    width: 16px !important;
    height: 16px !important;
    margin-top: -6px !important;
    background-color: ${colors.primaryWhite} !important;
  }

  .kg-range-slider__input {
    height: 36px !important;
    width: 43px !important;
    border: 1px solid ${colors.darkGrey} !important;
    color: ${colors.primaryWhite} !important;
    background-color: ${colors.secondaryBlack} !important;
    font-family: LinearSans;
    font-size: 14px;
  }

  .single-color-palette {
    background-color: #130e13;
  }

  .color-selector__selector__block {
    border: 1px solid ${colors.lightGrey};
  }
`;

const CustomLayerConfiguratorFactory = () => {
  const LayerConfigurator = (props: Props) => (
    <DatasetTitle dataset={props.datasets[props.layer.config.dataId]} section="mapStyle">
      <Container>
        <LayerColor {...props} />
        {props.layer.type === "geojson" ? <LayerStroke {...props} /> : <LayerRadius {...props} />}
      </Container>
    </DatasetTitle>
  );
  return LayerConfigurator;
};

const CustomLayerPanelFactory = () => {
  const CustomLayerPanelHeader = EmptyFactory();
  const CustomLayerConfigurator = CustomLayerConfiguratorFactory();

  const LayerPanel = LayerPanelFactory(CustomLayerConfigurator, CustomLayerPanelHeader);
  const CustomLayerPanelInstance = (props: any) => <LayerPanel {...props} />;

  return CustomLayerPanelInstance;
};

export default function CustomLayerManagerFactory() {
  const CustomAddDataButton = EmptyFactory();
  const CustomLayerPanel = CustomLayerPanelFactory();
  const CustomSourceDataCatalog = EmptyFactory();

  const LayerManager = LayerManagerFactory(
    CustomAddDataButton,
    CustomLayerPanel,
    CustomSourceDataCatalog,
  );

  const CustomLayerManager = (props: any) => <LayerManager {...props} />;

  return CustomLayerManager;
}
