import {
  SidebarFactory,
  injectComponents,
  PanelHeaderFactory,
  PanelToggleFactory,
  FilterManagerFactory,
  LayerManagerFactory,
  PanelTitleFactory,
  InteractionManagerFactory,
  MapPopoverFactory,
  ModalContainerFactory,
  ExportImageModalFactory,
  ModalDialogFactory,
  MapControlFactory,
  FilterPanelFactory,
  // @ts-ignore
} from "kepler.gl/components";

import CustomSidebarFactory from "./KeplerCustomComponents/CustomSidebarFactory";
import CustomPanelHeaderFactory from "./KeplerCustomComponents/CustomPanelHeaderFactory";
import CustomPanelToggleFactory from "./KeplerCustomComponents/CustomPanelToggleFactory";
import CustomFilterManagerFactory from "./KeplerCustomComponents/CustomFilterManagerFactory";
import CustomLayerManagerFactory from "./KeplerCustomComponents/CustomLayerManagerFactory";
import CustomPanelTitleFactory from "./KeplerCustomComponents/CustomPanelTitleFactory";
import CustomInteractionManagerFactory from "./KeplerCustomComponents/CustomInteractionManagerFactory";
import CustomMapPopoverFactory from "./KeplerCustomComponents/CustomMapPopoverFactory";
import CustomModalContainerFactory from "./KeplerCustomComponents/CustomModalContainerFactory";
import CustomExportImageModalFactory from "./KeplerCustomComponents/CustomExportImageModalFactory";
import CustomModalDialogFactory from "./KeplerCustomComponents/CustomModalDialogFactory";
import CustomMapControlFactory from "./KeplerCustomComponents/CustomMapControlFactory";
import CustomFilterPanelFactory from "./KeplerCustomComponents/CustomFilterPanelFactory";

export const KeplerGl = injectComponents([
  [SidebarFactory, CustomSidebarFactory],
  [PanelHeaderFactory, CustomPanelHeaderFactory],
  [PanelToggleFactory, CustomPanelToggleFactory],
  [FilterManagerFactory, CustomFilterManagerFactory],
  [LayerManagerFactory, CustomLayerManagerFactory],
  [PanelTitleFactory, CustomPanelTitleFactory],
  [InteractionManagerFactory, CustomInteractionManagerFactory],
  [MapPopoverFactory, CustomMapPopoverFactory],
  [ModalContainerFactory, CustomModalContainerFactory],
  [ExportImageModalFactory, CustomExportImageModalFactory],
  [ModalDialogFactory, CustomModalDialogFactory],
  [MapControlFactory, CustomMapControlFactory],
  [FilterPanelFactory, CustomFilterPanelFactory],
]);
