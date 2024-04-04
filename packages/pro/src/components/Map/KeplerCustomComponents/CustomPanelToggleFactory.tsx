import React, { useCallback, useMemo } from "react";
import styled from "styled-components";

import FilterIcon from "../../../assets/icons/map/filter.svg";
import MapStyleIcon from "../../../assets/icons/map/map-style.svg";
import DataIcon from "../../../assets/icons/map/data.svg";
import { colors } from "../../../consts";

const TabIcon = styled.i`
  display: inline-block;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  height: 20px;
  width: 20px;
`;

const StyledTab = styled.div`
  color: ${colors.primaryWhite};
  justify-content: center;
  font-family: LinearSans;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.6px;
  line-height: 20px;
  padding: 5px;
  cursor: pointer;
  align-items: center;
  display: flex;
  flex-grow: 1;
  justify-content: space-around;
  ${({ isActive }: { isActive: boolean }) => !isActive && "opacity: 0.7;"};
  border-bottom: ${({ isActive }: { isActive: boolean }) =>
    isActive ? "1px solid #4285f4" : "1px solid transparent"};
`;

const StyledHeaderWrapper = styled.div`
  justify-content: center;
  background-color: ${colors.secondaryBlack};
  padding: 0 16px;
  padding-top: 24px;
  gap: 0px;
  display: flex;
  min-height: 56px;
  border-bottom: 1px solid #424242;
`;

const getTabIcon = (id: string): string => {
  let icon = "";
  switch (id) {
    case "interaction":
      icon = MapStyleIcon;
      break;
    case "filter":
      icon = FilterIcon;
      break;
    case "layer":
      icon = DataIcon;
      break;
    default:
      break;
  }
  return icon;
};

const getTabName = (id: string): string => {
  let name = "";
  switch (id) {
    case "map":
      name = "Map Style";
      break;
    case "filter":
      name = "Filters";
      break;
    case "layer":
      name = "Data";
      break;
    case "interaction":
      name = "Map Style";
      break;
    default:
      break;
  }
  return name;
};

const CustomPanelTabFactory = () => {
  const CloseButton = ({
    panel,
    isActive,
    onClick,
  }: {
    panel: any;
    isActive: any;
    onClick: any;
  }) => {
    if (panel.id === "map") {
      return null;
    }
    return (
      <StyledTab isActive={isActive} onClick={() => onClick(panel)}>
        <TabIcon icon={getTabIcon(panel.id)} />
        {getTabName(panel.id)}
      </StyledTab>
    );
  };
  return CloseButton;
};

function CustomPanelToggleFactory(PanelTab: any) {
  const PanelToggle = ({ activePanel, panels, togglePanel }: any) => {
    const onClick = useCallback(
      (panel: any) => {
        const callback = panel.onClick || togglePanel;
        callback(panel.id);
      },
      [togglePanel],
    );

    const orderedPanels = useMemo(() => {
      const panelsCpy = [...panels];
      const filterIdx = panelsCpy.findIndex((panel: any) => panel.id === "filter");
      const mapIdx = panelsCpy.findIndex((panel: any) => panel.id === "map");

      const temp = panelsCpy[filterIdx];
      panelsCpy[filterIdx] = panelsCpy[mapIdx];
      panelsCpy[mapIdx] = temp;

      return panelsCpy;
    }, [panels]);

    return (
      <StyledHeaderWrapper>
        {orderedPanels.map((panel: any) => (
          <PanelTab
            key={panel.id}
            panel={panel}
            isActive={activePanel === panel.id}
            onClick={() => onClick(panel)}
          />
        ))}
      </StyledHeaderWrapper>
    );
  };

  return PanelToggle;
}

CustomPanelToggleFactory.deps = [CustomPanelTabFactory];

export default CustomPanelToggleFactory;
