import styled from "styled-components";
import { BrushConfigFactory, TooltipConfigFactory } from "@kepler.gl/components";
import { Datasets } from "@kepler.gl/table";
import { InteractionConfig, ValueOf } from "@kepler.gl/types";

import CustomTooltipConfigFactory from "./CustomTooltipConfigFactory";
import { StyledDivider } from "../../../components/Common";
import MapStyleSectionTitle from "../MapStyle/MapStyleSectionTitle";
import { colors } from "../../../consts";
import {
  ActionHandler,
  setColumnDisplayFormat as setColumnDisplayFormatAction,
} from "@kepler.gl/actions";
import { useCallback } from "react";

const StyledInteractionPanel = styled.div`
  background-color: ${colors.darkPurpleBackground};
  padding: 12px;
`;
interface InteractionPanelProps {
  datasets: Datasets;
  config: ValueOf<InteractionConfig>;
  onConfigChange: any;
  interactionConfigIcons?: {
    [key: string]: React.ElementType;
  };
  setColumnDisplayFormat: ActionHandler<typeof setColumnDisplayFormatAction>;
}

function CustomInteractionPanelFactory(
  TooltipConfig: ReturnType<typeof TooltipConfigFactory>,
  _BrushConfig: ReturnType<typeof BrushConfigFactory>,
) {
  const InteractionPanel = (props: InteractionPanelProps) => {
    const updateConfig = (newProp: any) => {
      props.onConfigChange({
        ...props.config,
        ...newProp,
      });
    };

    const onDisplayFormatChange = useCallback(
      (dataId: string, column: string, displayFormat: string) => {
        props.setColumnDisplayFormat(dataId, { [column]: displayFormat });
      },
      [props],
    );

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
            <TooltipConfig
              datasets={datasets}
              config={config.config}
              onChange={onChange}
              onDisplayFormatChange={onDisplayFormatChange}
            />
          )}
        </StyledInteractionPanel>
      </>
    );
  };
  return InteractionPanel;
}

CustomInteractionPanelFactory.deps = [CustomTooltipConfigFactory];

export default CustomInteractionPanelFactory;
