import { ModalContainerFactory } from "@kepler.gl/components";
import { dataURItoBlob, downloadFile } from "@kepler.gl/utils";

import { useAppSelector } from "../../../app/hooks";

function withUseMapData(Component: any) {
  return function WrappedComponent(props: any): JSX.Element {
    const projectName = useAppSelector((state) => state.project.projectName);
    const filteredProjectDatasets = useAppSelector(
      (state) => state.project.filteredProjectDatasets,
    );

    return (
      <Component
        {...props}
        projectName={projectName}
        filteredProjectDatasets={filteredProjectDatasets}
      />
    );
  };
}

function CustomModalContainerFactory(...deps: Parameters<typeof ModalContainerFactory>) {
  const ModalContainer = ModalContainerFactory(...deps) as any;
  // extend ModalContainer and override _onExportImage function
  class CustomModalContainer extends ModalContainer {
    constructor(props: any) {
      super(props);
      this._onExportImage = this._onExportImage.bind(this);
    }

    exportImage = (state: any, filename: string) => {
      const { imageDataUri } = state.uiState.exportImage;
      if (imageDataUri) {
        const file = dataURItoBlob(imageDataUri);
        downloadFile(file, filename);
      }
    };

    _onExportImage = () => {
      if (!this.props.uiState.exportImage.processing) {
        this.exportImage(this.props, `${this.props.projectName}.png`);
        this.props.uiStateActions.cleanupExportImage();
        this._closeModal();
      }
    };
  }
  return withUseMapData(CustomModalContainer);
}

CustomModalContainerFactory.deps = ModalContainerFactory.deps;

export default CustomModalContainerFactory;
