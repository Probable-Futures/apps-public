import { MouseEventHandler, PropsWithChildren, ReactElement } from "react";
import { Marker } from "react-map-gl";
import { Popover, ArrowContainer } from "react-tiny-popover";
import styled from "styled-components";
import { useMediaQuery } from "react-responsive";
import { components } from "@probable-futures/components-lib";

import { useTourData } from "../contexts/TourContext";
import PinIcon from "../assets/icons/map-pin.svg";
import { colors, size as screenSize } from "../consts";
import { useMapData } from "../contexts/DataContext";

type Props = {
  location?: string;
  lon: number;
  lat: number;
  size: "small" | "medium" | "large";
  hoverText: string;
  showTour: boolean;
  storyId: number;
  activeStoryTooltip?: number;
  setActiveStoryTooltip: (activeStoryTooltip?: number) => void;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

type TooltipProps = {
  message: string;
  show: boolean;
  onClickOutside: (e: MouseEvent) => void;
  onClick: MouseEventHandler<HTMLButtonElement>;
};

type MarkerSize = {
  width: number;
  height: number;
};

const Button = styled.button`
  width: ${({ size }: { size: MarkerSize }) => size.width}px;
  height: ${({ size }: { size: MarkerSize }) => size.height}px;
  cursor: pointer;
  border: none;
  background-image: url(${PinIcon});
  background-repeat: no-repeat;
  background-size: ${({ size }: { size: MarkerSize }) => `${size.width}px auto`};
  background-position: center;
  background-color: transparent;
  outline: 0;
  padding: 0;
`;

const TooltipContent = styled.button`
  color: ${colors.black};
  background-color: ${colors.white};
  padding: 6px 14px;
  border: 1px solid ${colors.darkPurple};
  font-size: 13px;
  letter-spacing: 0;
  line-height: 18px;
  width: 125px;
  box-sizing: content-box;
  cursor: pointer;
  text-align: left;

  p {
    margin: 0;
    padding: 0;
  }
`;

const Tooltip = ({
  message,
  show,
  children,
  onClickOutside,
  onClick,
}: PropsWithChildren<TooltipProps>) => (
  <Popover
    isOpen={show}
    positions={["right"]}
    onClickOutside={onClickOutside}
    content={({ position, childRect, popoverRect }) => (
      <ArrowContainer
        position={position}
        childRect={childRect}
        popoverRect={popoverRect}
        arrowColor={colors.darkPurple}
        arrowSize={10}
      >
        <ArrowContainer
          position={position}
          childRect={childRect}
          popoverRect={popoverRect}
          arrowColor={colors.white}
          arrowSize={11}
          style={{ padding: 0 }}
          arrowStyle={{
            left: 2,
            borderRight: `10px solid ${colors.white}`,
            zIndex: 1,
          }}
        >
          <TooltipContent onClick={onClick} dangerouslySetInnerHTML={{ __html: message }} />
        </ArrowContainer>
      </ArrowContainer>
    )}
  >
    {children as ReactElement}
  </Popover>
);

export default function StoryMarker({
  location,
  lon,
  lat,
  storyId,
  showTour,
  onClick,
  hoverText,
  activeStoryTooltip,
  setActiveStoryTooltip,
}: Props): JSX.Element {
  const { isTourActive, step, steps, onNext, onClose } = useTourData();
  const { stories } = useMapData();
  const markerSize = { width: 30, height: 35 };
  const defaultHoverText = `Read vignette${location ? ` about ${location}` : ""}`;

  const isTablet = useMediaQuery({
    query: `(max-width: ${screenSize.tabletMax})`,
  });

  return (
    <Marker longitude={lon} latitude={lat}>
      {showTour && isTourActive ? (
        <components.TourBox
          show={step === 2}
          position="left"
          onClose={onClose}
          onNext={onNext}
          step={step}
          steps={steps}
          stories={stories}
          isTourActive={isTourActive}
        >
          <Button size={markerSize} onClick={onClick} />
        </components.TourBox>
      ) : (
        <Tooltip
          message={hoverText ? hoverText : defaultHoverText}
          show={activeStoryTooltip === storyId}
          onClickOutside={() => setActiveStoryTooltip(undefined)}
          onClick={onClick}
        >
          <Button
            size={markerSize}
            onClick={onClick}
            onMouseEnter={() => setActiveStoryTooltip(storyId)}
            onMouseLeave={() => !isTablet && setActiveStoryTooltip(undefined)}
          />
        </Tooltip>
      )}
    </Marker>
  );
}
