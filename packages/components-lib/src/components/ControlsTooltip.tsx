import { PropsWithChildren, ReactElement } from "react";
import { Popover, ArrowContainer } from "react-tiny-popover";
import styled from "styled-components";
import { colors } from "@probable-futures/lib";

type TooltipProps = {
  show: boolean;
  tooltipContent: string | ReactElement;
  onClickOutside: (e: MouseEvent) => void;
};

const TooltipContent = styled.button`
  cursor: pointer;
  color: ${colors.black};
  background-color: ${colors.white};
  padding: 6px 14px;
  border: 1px solid ${colors.darkPurple};
  font-size: 13px;
  letter-spacing: 0;
  line-height: 18px;
  width: 125px;
  box-sizing: content-box;
`;

const Tooltip = ({
  tooltipContent,
  show,
  children,
  onClickOutside,
}: PropsWithChildren<TooltipProps>) => (
  <Popover
    isOpen={show}
    positions={["left"]}
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
            right: 2,
            borderLeft: `10px solid ${colors.white}`,
            zIndex: 1,
          }}
        >
          {typeof tooltipContent === "string" ? (
            <TooltipContent>{tooltipContent}</TooltipContent>
          ) : (
            tooltipContent
          )}
        </ArrowContainer>
      </ArrowContainer>
    )}
  >
    {children as ReactElement}
  </Popover>
);

export default Tooltip;
