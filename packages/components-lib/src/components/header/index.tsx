import MediaQuery from "react-responsive";
import styled from "styled-components";
import camelcase from "lodash.camelcase";
import { size, colors, HEADER_HEIGHT } from "@probable-futures/lib/src/consts";
import { Option, TourProps, Map, WarmingScenarioDescs } from "@probable-futures/lib/src/types";

import DatasetSelector from "./DatasetSelector";
import Degrees from "./Degrees";
import { useTheme } from "../../contexts";

type Props = {
  warmingScenarioDescs: WarmingScenarioDescs;
  showDegreeDescription: boolean;
  showDescriptionModal: boolean;
  selectedDataset: Map;
  showBaselineModal: boolean;
  datasets: Map[];
  moreIsOpen: boolean;
  degrees: number;
  tourProps?: TourProps;
  headerText?: any;
  onDatasetDropdownRefChange: (ref: HTMLDivElement) => void;
  onWarmingScenarioDescriptionCancel?: () => void;
  onWarmingScenarioClick?: (value: number, hasDescription: boolean) => void;
  onDatasetChange?: (option: Option) => void;
  onInfoClick?: () => void;
};

type ContainerProps = {
  moreIsOpen: boolean;
};

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${HEADER_HEIGHT};
  box-sizing: content-box;
  z-index: ${({ moreIsOpen }: ContainerProps) => (moreIsOpen ? 2 : 5)};

  @media (min-width: ${size.tablet}), (orientation: landscape) {
    border-bottom: 1px solid ${colors.darkPurple};
    z-index: 2;
  }

  @media (min-width: ${size.laptop}) {
    z-index: 3;
  }
`;

const Content = styled.div`
  height: 60px;
  display: flex;
  align-items: center;
  flex: 1;

  @media (min-width: ${size.tablet}) {
    max-width: 1540px;
    margin: 0 auto;
  }

  @media (min-width: ${size.laptop}) {
    height: ${HEADER_HEIGHT};
  }
`;

const Header = ({
  warmingScenarioDescs,
  onDatasetDropdownRefChange,
  showDegreeDescription,
  showDescriptionModal,
  selectedDataset,
  showBaselineModal,
  datasets,
  moreIsOpen,
  degrees,
  tourProps,
  headerText,
  onWarmingScenarioDescriptionCancel,
  onWarmingScenarioClick,
  onDatasetChange,
  onInfoClick,
}: Props) => {
  const { color, backgroundColor } = useTheme();
  const datasetNames = headerText?.datasets || {};

  return (
    <Container id="map-header" moreIsOpen={moreIsOpen} style={{ color, backgroundColor }}>
      <Content ref={onDatasetDropdownRefChange}>
        <DatasetSelector
          value={{
            value: selectedDataset.slug || "",
            label: datasetNames[camelcase(selectedDataset.slug)] || selectedDataset.name,
          }}
          onChange={onDatasetChange}
          datasets={datasets}
          tourProps={tourProps}
          onInfoClick={onInfoClick}
          showDescriptionModal={showDescriptionModal}
          headerText={headerText ? headerText["datasets"] : null}
        />
        <MediaQuery minWidth={size.laptop}>
          <Degrees
            degrees={degrees}
            warmingScenarioDescs={warmingScenarioDescs}
            showDegreeDescription={showDegreeDescription}
            showBaselineModal={showBaselineModal}
            tourProps={tourProps}
            onWarmingScenarioDescriptionCancel={onWarmingScenarioDescriptionCancel}
            onWarmingScenarioClick={onWarmingScenarioClick}
            headerText={headerText}
          />
        </MediaQuery>
      </Content>
    </Container>
  );
};

export default Header;
