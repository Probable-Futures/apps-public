import React from "react";
import {
  PanelHeaderContent,
  PanelHeaderSubTitle,
  PanelHeaderTitle,
  StyledPanelHeader,
} from "../../../components/Common";
import MapSwitch from "../Common/MapSwitch";

type Props = {
  title: string;
  hasSwitch: boolean;
  checked?: boolean;
  isSubtitle?: boolean;
  onSwitchToggle?: () => void;
};

const MapStyleSectionTitle = ({
  title,
  hasSwitch,
  checked,
  isSubtitle,
  onSwitchToggle,
}: Props): JSX.Element => {
  return (
    <StyledPanelHeader>
      <PanelHeaderContent>
        {isSubtitle ? (
          <PanelHeaderSubTitle>{title}</PanelHeaderSubTitle>
        ) : (
          <PanelHeaderTitle>{title}</PanelHeaderTitle>
        )}
      </PanelHeaderContent>
      <div>
        {hasSwitch && (
          <MapSwitch
            checked={!!checked}
            onChange={() => {
              if (onSwitchToggle) {
                onSwitchToggle();
              }
            }}
          />
        )}
      </div>
    </StyledPanelHeader>
  );
};

export default MapStyleSectionTitle;
