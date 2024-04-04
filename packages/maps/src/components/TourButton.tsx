import { useState } from "react";
import styled from "styled-components";
import { components, styles } from "@probable-futures/components-lib";
import { ReactComponent as CancelIcon } from "@probable-futures/components-lib/src/assets/icons/cancel.svg";

import { useTourData } from "../contexts/TourContext";
import { ReactComponent as TourIcon } from "../assets/icons/tour.svg";
import { trackEvent } from "../utils/analytics";
import { useMapData } from "../contexts/DataContext";
import { colors } from "../consts";
import { useTranslation } from "../contexts/TranslationContext";

const Separator = styled.div`
  box-sizing: border-box;
  border-left: 1px solid ${colors.grey};
  height: 19px;
`;

const CloseIconWrapper = styled.div`
  cursor: pointer;
  display: flex;

  svg {
    width: 20px;
    height: 20px;

    path {
      fill: ${colors.darkPurple};
    }
  }
`;

const TooltipContent = styled.button`
  background-color: ${colors.white};
  padding: 8px 10px 8px 14px;
  border: 1px solid ${colors.darkPurple};
  box-sizing: content-box;
  display: flex;
  align-items: center;
  position: relative;
  gap: 10px;
  height: 16px;
`;

const Message = styled.span`
  font-size: 13px;
  letter-spacing: 0;
  color: ${colors.black};
  line-height: 16px;
`;

const TourButton = ({ last }: { last: boolean }) => {
  const [showTourTooltip, setShowTourTooltip] = useState(false);
  const { isTourActive, setIsTourActive, setStep, steps } = useTourData();
  const { selectedDataset } = useMapData();
  const { translate } = useTranslation();

  const onCloseButtonClick = (event: any) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setIsTourActive(false);
    setStep(0);
  };

  const onTakeTourButtonClick = () => {
    setIsTourActive(true);
    trackEvent("Map tour started", {
      props: {
        map: `${selectedDataset?.name}`,
      },
    });
  };

  const renderTooltipContent = () => (
    <TooltipContent>
      <Message>{message}</Message>
      <Separator></Separator>
      <CloseIconWrapper onClick={onCloseButtonClick}>
        <CancelIcon />
      </CloseIconWrapper>
    </TooltipContent>
  );

  const message = isTourActive
    ? translate("mapControl.closeTheTour")
    : translate("mapControl.takeQuickTour");

  return (
    <>
      {Object.keys(steps).length > 0 && (
        <components.ControlsTooltip
          show={showTourTooltip || isTourActive}
          onClickOutside={() => setShowTourTooltip(false)}
          tooltipContent={isTourActive ? renderTooltipContent() : message}
        >
          <styles.ControlButton
            title={message}
            onClick={onTakeTourButtonClick}
            onMouseEnter={() => setShowTourTooltip(true)}
            onMouseLeave={() => setShowTourTooltip(false)}
            active={isTourActive}
            last={last}
          >
            <TourIcon />
          </styles.ControlButton>
        </components.ControlsTooltip>
      )}
    </>
  );
};

export default TourButton;
