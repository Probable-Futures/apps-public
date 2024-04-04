import styled from "styled-components";

import { colors } from "../../../consts";

const PFTitle = styled.div`
  height: 28px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 24px;
  letter-spacing: 0;
  line-height: 28px;
  margin-bottom: 16px;
`;

type Title = "sidebar.panels.filter" | "sidebar.panels.layer" | "sidebar.panels.interaction";
const getTile = (id: Title) => {
  let title = "";
  switch (id) {
    case "sidebar.panels.filter":
      title = "Filters";
      break;
    case "sidebar.panels.layer":
      title = "Data";
      break;
    case "sidebar.panels.interaction":
      title = "Map Style";
      break;
    default:
      break;
  }
  return title;
};

function CustomPanelTitleFactory() {
  const CustomPanelTitleAction = (props: any) => {
    return <PFTitle>{getTile(props.children.props.id)}</PFTitle>;
  };

  return CustomPanelTitleAction;
}

export default CustomPanelTitleFactory;
