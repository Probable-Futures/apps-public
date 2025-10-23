import { LayerManagerFactory, SourceDataCatalogProps } from "@kepler.gl/components";
import styled from "styled-components";
import { Datasets } from "@kepler.gl/table";
import { Layer, LayerClassesType } from "@kepler.gl/layers";
import {
  UIStateActions,
  VisStateActions,
  MapStateActions,
  ActionHandler,
} from "@kepler.gl/actions";
import { PanelListView } from "@kepler.gl/types";
import { SidePanelItem } from "@kepler.gl/components/dist/types";
import { WrappedComponentProps } from "react-intl";

import { useMapData } from "../../../contexts/DataContext";
import { EmptyFactory, PfProLogo } from "../../Common";
import { colors } from "../../../consts";
import Data from "../Data";
import { TabTitle } from "../../../shared/styles/styles";

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
  position: relative;

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

export type LayerManagerProps = {
  datasets: Datasets;
  layers: Layer[];
  layerOrder: string[];
  layerClasses: LayerClassesType;
  layerBlending: string;
  overlayBlending: string;
  uiStateActions: typeof UIStateActions;
  visStateActions: typeof VisStateActions;
  mapStateActions: typeof MapStateActions;
  showAddDataModal: () => void;
  removeDataset: ActionHandler<typeof UIStateActions.openDeleteModal>;
  showDatasetTable: ActionHandler<typeof VisStateActions.showDatasetTable>;
  updateTableColor: ActionHandler<typeof VisStateActions.updateTableColor>;
  panelListView: PanelListView;
  panelMetadata: SidePanelItem;
  showDeleteDataset?: boolean;
} & WrappedComponentProps;

const AddDataButton = () => {
  const { setShowMergeDataModal } = useMapData();
  return (
    <StyledAddButton className="add-data-button" onClick={() => setShowMergeDataModal(true)}>
      Add Data
    </StyledAddButton>
  );
};

const CustomSourceDataCatalogFactory = () => {
  const SourceDataCatalog = ({ showDatasetTable }: SourceDataCatalogProps) => {
    return (
      <>
        <Data onShowDatasetTable={showDatasetTable} />
        <AddDataButton />
      </>
    );
  };

  return SourceDataCatalog;
};

function CustomLayerManagerFactory(...deps: Parameters<typeof LayerManagerFactory>) {
  const LayerManager = LayerManagerFactory(...deps);
  const CustomLayerManager = (props: LayerManagerProps) => (
    <>
      <StyledLayerManagerContainer>
        <TabTitle>Data</TabTitle>
        <LayerManager {...props} />
      </StyledLayerManagerContainer>
      <PfProLogo />
    </>
  );

  return CustomLayerManager;
}

CustomLayerManagerFactory.deps = [
  EmptyFactory,
  EmptyFactory,
  EmptyFactory,
  EmptyFactory,
  CustomSourceDataCatalogFactory,
  EmptyFactory,
  EmptyFactory,
];

export default CustomLayerManagerFactory;
