import { Popup, PopupEvent } from "react-map-gl";
import styled from "styled-components";
import { ReactComponent as CancelIcon } from "@probable-futures/components-lib/src/assets/icons/cancel.svg";
import { whiteFilter } from "@probable-futures/components-lib/src/styles";

import { colors } from "../../consts";

type Props = {
  longitude: number;
  latitude: number;
  title: string;
  description: string;
  onClose?: (e: PopupEvent) => void;
};

const Container = styled(Popup)`
  z-index: 1;
  font-weight: 400;
  font-size: 18px;
  line-height: 22px;
  margin-top: 10px;

  .mapboxgl-popup-tip {
    display: none;
  }

  .mapboxgl-popup-content {
    background-color: ${colors.white};
    border: 1px solid ${colors.dimBlack};
    box-sizing: border-box;
    box-shadow: none;
    border-radius: 100px;
    padding: 8px 20px;
  }

  .mapboxgl-popup-close-button {
    display: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto 0;
  right: 10px;
  width: 17px;
  height: 17px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  ${whiteFilter}

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover {
    background-color: transparent;
  }
`;

const Title = styled.span`
  display: block;
  max-width: 450px;
  color: ${colors.dimBlack};
  margin-right: 15px;
  text-transform: capitalize;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SearchPopup = ({ longitude, latitude, title, description, onClose }: Props) => (
  <Container
    latitude={latitude}
    longitude={longitude}
    closeButton={false}
    closeOnClick={false}
    onClose={onClose}
    anchor="bottom"
    maxWidth="none"
  >
    <CloseButton onClick={() => onClose?.({} as PopupEvent)}>
      <CancelIcon />
    </CloseButton>
    <Title>{title}</Title>
  </Container>
);

export default SearchPopup;
