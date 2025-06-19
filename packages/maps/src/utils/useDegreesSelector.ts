import { useEffect } from "react";

import { useMapData } from "../contexts/DataContext";
import { trackEvent } from "../utils/analytics";
import { setQueryParam } from "../utils";

const useDegreesSelector = () => {
  const { degrees, setDegrees, selectedDataset, showBaselineModal, setShowBaselineModal } =
    useMapData();

  useEffect(() => {
    setShowBaselineModal((show: boolean) => (show ? false : show));
  }, [degrees, selectedDataset, setShowBaselineModal]);

  const onButtonClick = (value: number, hasDescription: boolean) => {
    const eventProps = {
      props: {
        map: `${selectedDataset?.name}`,
        warming_scenario: value,
      },
    };
    if (showBaselineModal) {
      setShowBaselineModal(false);
    } else if (
      value === 0.5 &&
      (selectedDataset?.isDiff || selectedDataset?.name.toLowerCase().startsWith("change"))
    ) {
      setShowBaselineModal(true);
    } else {
      setDegrees(value);
      setQueryParam({ warmingScenario: value });
    }

    trackEvent("Warming tab clicked", eventProps);
  };

  return {
    onButtonClick,
  };
};

export default useDegreesSelector;
