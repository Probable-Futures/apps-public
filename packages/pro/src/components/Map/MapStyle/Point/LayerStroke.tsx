import {
  LayerColorRangeSelector,
  LayerColorSelector,
  // @ts-ignore
} from "kepler.gl/components";
import styled from "styled-components";

import { MapStyleLabel, SideBarSubSection } from "../../../Common";
import { getVisConfiguratorProps } from "../../../../utils";
import MapStyleSectionTitle from "../MapStyleSectionTitle";

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

const ColorSelectorWrapper = styled.div`
  margin-top: 6px;
`;

const LayerStroke = (props: Props): JSX.Element => {
  const visConfiguratorProps = getVisConfiguratorProps(props);
  const { layer } = props;
  const property = "stroked";
  const defaultSwitchValue =
    typeof layer.config.visConfig[property] === "boolean" ? layer.config.visConfig[property] : true;

  return (
    <div>
      <MapStyleSectionTitle
        hasSwitch={true}
        title="Stroke"
        checked={defaultSwitchValue}
        onSwitchToggle={() =>
          visConfiguratorProps.onChange({
            [property]: !defaultSwitchValue,
          })
        }
      />
      {defaultSwitchValue && (
        <SideBarSubSection>
          <MapStyleLabel>Stroke color</MapStyleLabel>
          <ColorSelectorWrapper>
            {layer.config.strokeColorField ? (
              <LayerColorRangeSelector {...visConfiguratorProps} property="strokeColorRange" />
            ) : (
              <LayerColorSelector
                {...visConfiguratorProps}
                selectedColor={layer.config.visConfig.strokeColor}
                property="strokeColor"
              />
            )}
          </ColorSelectorWrapper>
        </SideBarSubSection>
      )}
    </div>
  );
};

export default LayerStroke;
