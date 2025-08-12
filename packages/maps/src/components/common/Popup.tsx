import { Popup as MapPopup, PopupEvent } from "react-map-gl";
import styled from "styled-components";

import CloseIcon from "@probable-futures/components-lib/src/assets/icons/cancel-circle.svg";
import { types } from "@probable-futures/lib";
import { useTourData } from "../../contexts/TourContext";
import { colors } from "../../consts";
import { PropsWithChildren } from "react";
import { purpleFilter } from "@probable-futures/components-lib/src/styles/commonStyles";

type Props = {
  feature: types.PopupFeature;
  onClose?: (e: PopupEvent) => void;
};

const Container = styled(MapPopup)`
  z-index: 1;

  .mapboxgl-popup-tip {
    width: 12px;
    height: 12px;
    transform: rotate(45deg);
    background-color: ${colors.white};
    border-width: 1px !important;
    margin-bottom: -8px;
    border-left: 1px solid ${colors.grey};
    border-top: 1px solid ${colors.grey};
    box-sizing: content-box;
  }

  .mapboxgl-popup-content {
    background-color: ${colors.white};
    border-radius: 6px;
    border: 1px solid ${colors.grey};
    padding: 16px 16px 0;
    box-sizing: border-box;
    box-shadow: none;

    &::before {
      display: ${({ showClickArea }: { showClickArea: boolean }) =>
        showClickArea ? "block" : "none"};
      content: "";
      position: absolute;
      top: -23px;
      left: calc(50% - 13px);
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1px dashed ${colors.black};
      box-shadow: 0 0 1px 1px ${colors.whiteOriginal};
      box-sizing: border-box;
    }
  }

  .mapboxgl-popup-close-button {
    position: absolute;
    top: 12px;
    right: 12px;
    font-size: 0;
    width: 20px;
    height: 20px;
    background-image: url(${CloseIcon});
    background-repeat: no-repeat;
    background-size: 20px auto;
    background-position: center;

    &:hover {
      background-color: transparent;
      ${purpleFilter}
    }
  }
`;

const Popup = ({ feature, onClose, children }: PropsWithChildren<Props>): JSX.Element => {
  const { isTourActive, step } = useTourData();

  const { latitude, longitude } = feature;

  return (
    <Container
      latitude={latitude}
      longitude={longitude}
      closeButton
      closeOnClick={false}
      onClose={onClose}
      anchor="top"
      showClickArea={isTourActive && step === 1}
      maxWidth="none"
      focusAfterOpen={false}
    >
      {children}
    </Container>
  );
};

export default Popup;
