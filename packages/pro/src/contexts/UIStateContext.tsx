import React, { PropsWithChildren, useState } from "react";
import { AboutMapResources } from "@probable-futures/lib";

import { Props as ImportReviewProps } from "../components/Common/ImportReview";

type UIState = {
  showMergeDataModal: boolean;
  showImportReviewModal: boolean;
  importReviewProps?: ImportReviewProps;
  showBaselineModal: boolean;
  showDescriptionModal: boolean;
  showAboutMap: boolean;
  aboutMapResources?: AboutMapResources;
  setShowMergeDataModal(arg: boolean): void;
  setShowImportReviewModal(arg: boolean): void;
  setImportReviewProps(arg: any): void;
  setShowBaselineModal(arg: any): void;
  setShowDescriptionModal(arg: any): void;
  setShowAboutMap(arg: any): void;
  setAboutMapResources: (arg: AboutMapResources) => void;
};

const initialUIState: UIState = {
  showMergeDataModal: false,
  showImportReviewModal: false,
  importReviewProps: undefined,
  showBaselineModal: false,
  showDescriptionModal: false,
  showAboutMap: false,
  aboutMapResources: undefined,
  setShowMergeDataModal: () => {},
  setShowImportReviewModal: () => {},
  setImportReviewProps: () => {},
  setShowBaselineModal: () => {},
  setShowDescriptionModal: () => {},
  setShowAboutMap: () => {},
  setAboutMapResources: () => {},
};

const UIStateContext = React.createContext<UIState>(initialUIState);

export function UIStateProvider(props: PropsWithChildren<{}>): JSX.Element {
  const [showMergeDataModal, setShowMergeDataModal] = useState(false);
  const [showImportReviewModal, setShowImportReviewModal] = useState(false);
  const [importReviewProps, setImportReviewProps] = useState<ImportReviewProps>();
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showAboutMap, setShowAboutMap] = useState(false);
  const [aboutMapResources, setAboutMapResources] = useState<AboutMapResources>();

  const value = React.useMemo(
    () => ({
      showMergeDataModal,
      setShowMergeDataModal,
      showImportReviewModal,
      setShowImportReviewModal,
      importReviewProps,
      setImportReviewProps,
      showBaselineModal,
      setShowBaselineModal,
      showDescriptionModal,
      setShowDescriptionModal,
      showAboutMap,
      setShowAboutMap,
      aboutMapResources,
      setAboutMapResources,
    }),
    [
      showMergeDataModal,
      showImportReviewModal,
      importReviewProps,
      showBaselineModal,
      showDescriptionModal,
      showAboutMap,
      aboutMapResources,
    ],
  );

  return <UIStateContext.Provider value={value}>{props.children}</UIStateContext.Provider>;
}

export function useUIState(): UIState {
  return React.useContext(UIStateContext);
}
