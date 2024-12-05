import { PropsWithChildren } from "react";
import { Popup as MapPopup, PopupEvent } from "react-map-gl";
import styled from "styled-components";

import { types } from "@probable-futures/lib";
import { PopupContainerCss } from "../../consts/styles";

type Props = {
  feature: types.PopupFeature;
  onClose?: (e: PopupEvent) => void;
};

const Container = styled(MapPopup)`
  ${PopupContainerCss}
`;

const Popup = ({ feature, onClose, children }: PropsWithChildren<Props>): JSX.Element => {
  const { latitude, longitude } = feature;

  return (
    <Container
      latitude={latitude}
      longitude={longitude}
      closeButton
      closeOnClick={false}
      onClose={onClose}
      anchor="top"
      maxWidth="none"
    >
      {children}
    </Container>
  );
};

export default Popup;
