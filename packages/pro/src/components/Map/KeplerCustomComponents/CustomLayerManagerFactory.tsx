//@ts-ignore
import { LayerManagerFactory } from "kepler.gl/components";
import styled from "styled-components";

import { useMapData } from "../../../contexts/DataContext";
import { PfProLogo } from "../../Common";
import { colors } from "../../../consts";
import Data from "../Data";

const StyledAddButton = styled.button`
  width: 91px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 14px;
  letter-spacing: 0;
  line-height: 28px;
  text-align: center;
  background: transparent;
  border: 1px solid white;
  cursor: pointer;
  &:hover {
    border: 1px solid ${colors.secondaryBlue};
    color: ${colors.secondaryBlue};
  }
`;

const StyledLayerManagerContainer = styled.div`
  overflow-y: scroll;
  position: relative;
  overflow-x: hidden;
  width: calc(100% + 12px);
  padding-right: 13px;
  z-index: 2;
  height: calc(100vh - 230px);

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

  .side-panel-section {
    display: none;
  }
  .side-panel-divider {
    display: none;
  }
`;

const CustomAddDataButtonFactory = () => {
  const AddDataButton = () => {
    const { setShowMergeDataModal } = useMapData();
    return (
      <StyledAddButton className="add-data-button" onClick={() => setShowMergeDataModal(true)}>
        Add Data
      </StyledAddButton>
    );
  };

  return AddDataButton;
};

const CustomLayerPanelFactory = () => {
  const CustomLayerPanel = () => {
    return null;
  };
  return CustomLayerPanel;
};

const CustomSourceDataCatalogFactory = () => {
  const SourceDataCatalog = ({ showDatasetTable }: { showDatasetTable: any }) => (
    <Data onShowDatasetTable={showDatasetTable} />
  );

  return SourceDataCatalog;
};

function CustomLayerManagerFactory(...deps: any) {
  const LayerManager = LayerManagerFactory(...deps);
  const CustomLayerManager = (props: any) => (
    <>
      <StyledLayerManagerContainer>
        <LayerManager {...props} />
      </StyledLayerManagerContainer>
      <PfProLogo />
    </>
  );

  return CustomLayerManager;
}

CustomLayerManagerFactory.deps = [
  CustomAddDataButtonFactory,
  CustomLayerPanelFactory,
  CustomSourceDataCatalogFactory,
];

export default CustomLayerManagerFactory;
