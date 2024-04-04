import styled from "styled-components";
// @ts-ignore
import { BrushConfigFactory } from "kepler.gl/components";

import CustomTooltipConfigFactory from "./CustomTooltipConfigFactory";
import { StyledDivider } from "../../../components/Common";
import MapStyleSectionTitle from "../MapStyle/MapStyleSectionTitle";
import { colors } from "../../../consts";

const StyledInteractionPanel = styled.div`
  background-color: ${colors.darkPurpleBackground};
  padding: 12px;
`;

type Props = {
  datasets: any;
  config: any;
  onConfigChange: Function;
};

CustomInteractionPanelFactory.deps = [CustomTooltipConfigFactory, BrushConfigFactory];

function CustomInteractionPanelFactory(TooltipConfig: any) {
  const InteractionPanel = (props: Props) => {
    const updateConfig = (newProp: any) => {
      props.onConfigChange({
        ...props.config,
        ...newProp,
      });
    };

    const { config, datasets }: any = props;
    const onChange = (newConfig: any) => updateConfig({ config: newConfig });
    const configIdsTobeIgnored = ["geocoder", "brush", "coordinate"];

    if (configIdsTobeIgnored.includes(config.id)) {
      return null;
    }

    return (
      <>
        <StyledDivider />
        <StyledInteractionPanel>
          <MapStyleSectionTitle
            hasSwitch={true}
            title="Tooltip Content"
            checked={config.enabled}
            onSwitchToggle={() => updateConfig({ enabled: !config.enabled })}
          />
          {config.enabled && (
            <TooltipConfig datasets={datasets} config={config.config} onChange={onChange} />
          )}
        </StyledInteractionPanel>
      </>
    );
  };
  return InteractionPanel;
}

export default CustomInteractionPanelFactory;
