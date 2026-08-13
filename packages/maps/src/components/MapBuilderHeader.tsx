import styled from "styled-components";
import camelcase from "lodash.camelcase";

import { colors } from "../consts";
import { useMenu } from "./Menu";
import { useTranslation } from "../contexts/TranslationContext";

const Container = styled.div`
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  background-color: ${colors.white};
  border-bottom: 1px solid ${colors.lightGrey};
  /* No border-left: the sidebar's border-right now covers this edge full height,
     and keeping both renders a doubled line across the header. */
  transition: transform 0.7s ease;
  box-sizing: border-box;
  transform: ${({ sidebarOpen }: { sidebarOpen: boolean }) =>
    sidebarOpen ? "translateX(256px)" : "translateX(52px)"};

  p {
    font-size: 18px;
    line-height: 22px;
    margin: 0;
    padding: 16px 50px;
  }
`;

const Versions = styled.span`
  font-family: "RelativeMono";
  color: ${colors.lightGrey2};
`;

const MapBuilderHeader = () => {
  const {
    sidebar,
    data: { selectedDataset, isVersionComparisonActive, versionBefore, versionAfter },
  } = useMenu();
  const { translate } = useTranslation();

  if (!selectedDataset) {
    return null;
  }

  const isComparing = isVersionComparisonActive && versionBefore && versionAfter;

  return (
    <Container sidebarOpen={sidebar.isVisible}>
      <p>
        {translate(`header.datasets.${camelcase(selectedDataset.slug)}`, selectedDataset.name)}
        {isComparing ? (
          <Versions>
            {" — "}
            {`v${versionBefore.mapVersion} vs v${versionAfter.mapVersion}`}
          </Versions>
        ) : (
          ` - ${selectedDataset.dataset.model}`
        )}
      </p>
    </Container>
  );
};

export default MapBuilderHeader;
