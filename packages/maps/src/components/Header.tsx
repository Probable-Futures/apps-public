import { useCallback } from "react";

import { components, contexts } from "@probable-futures/components-lib";
import { types } from "@probable-futures/lib";
import useDegreesSelector from "../utils/useDegreesSelector";
import { setQueryParam } from "../utils";
import { trackEvent } from "../utils/analytics";
import { defaultDegreesForChangeMaps, useMapData } from "../contexts/DataContext";
import { useTourData } from "../contexts/TourContext";
import { useTranslation } from "../contexts/TranslationContext";
import { sendDataToChatbot } from "../utils/chatbot";

type Props = {
  onDatasetDropdownRefChange: (ref: HTMLDivElement) => void;
};

const Header = ({ onDatasetDropdownRefChange }: Props) => {
  const {
    selectedDataset,
    degrees,
    stories,
    showBaselineModal,
    showDescriptionModal,
    setShowDescriptionModal,
    warmingScenarioDescs,
    showDegreeDescription,
    datasets,
    moreIsOpen,
    setSelectedDataset,
    setDegrees,
  } = useMapData();
  const { onCancel, onButtonClick } = useDegreesSelector();
  const { step, steps, isTourActive, onClose, onNext } = useTourData();
  const { translate } = useTranslation();

  const onDatasetChange = useCallback(
    ({ value }: types.Option) => {
      const dataset = datasets.find(({ slug, isLatest }) => slug === value && isLatest);
      if (dataset) {
        setSelectedDataset(dataset);
        let warmingScenario = undefined;
        if (
          degrees === 0.5 &&
          (dataset.isDiff || dataset?.name.toLowerCase().startsWith("change"))
        ) {
          setDegrees(defaultDegreesForChangeMaps);
          warmingScenario = defaultDegreesForChangeMaps;
        }
        setQueryParam({
          mapSlug: dataset.slug,
          warmingScenario,
          version: "latest",
        });
        trackEvent("Map viewed", { props: { map: dataset.name } });

        sendDataToChatbot({
          dataset,
          warmingScenario: degrees,
          action: "fetchData",
        });
      }
    },
    [datasets, degrees, setDegrees, setSelectedDataset],
  );

  if (!selectedDataset) {
    return null;
  }

  return (
    <contexts.ThemeProvider theme="light">
      <components.Header
        warmingScenarioDescs={warmingScenarioDescs}
        onDatasetDropdownRefChange={onDatasetDropdownRefChange}
        showDegreeDescription={showDegreeDescription}
        showDescriptionModal={showDescriptionModal}
        selectedDataset={selectedDataset}
        showBaselineModal={showBaselineModal}
        datasets={datasets}
        moreIsOpen={moreIsOpen}
        degrees={degrees}
        tourProps={{
          step,
          isTourActive,
          steps,
          stories,
          onNext,
          onClose,
        }}
        onWarmingScenarioDescriptionCancel={onCancel}
        onWarmingScenarioClick={onButtonClick}
        onDatasetChange={onDatasetChange}
        onInfoClick={() => setShowDescriptionModal((show: boolean) => !show)}
        headerText={translate("header")}
      />
    </contexts.ThemeProvider>
  );
};

export default Header;
