import React, { useState } from "react";
import { Popover, ArrowContainer } from "react-tiny-popover";
import { useMediaQuery } from "react-responsive";
import styled from "styled-components";
import { styles } from "@probable-futures/components-lib";

import { useWindowHeight } from "../../utils/useWindowHeight";
import { colors, size } from "../../consts";
import InfoIcon from "../../assets/icons/map/info.svg";

type Props = {
  text?: string;
};

const Container = styled.div`
  width: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const InfoButton = styled.button`
  position: relative;
  height: 12px;
  width: 12px;
  background-image: url(${InfoIcon});
  background-repeat: no-repeat;
  background-position: center;
  background-color: transparent;
  border: none;
  outline: 0;
  cursor: pointer;
  padding: 0;
  ${({ isPopoverOpen }: { isPopoverOpen: Boolean }) => isPopoverOpen && styles.blueFilter}

  @media (min-width: ${size.laptop}) {
    &:hover {
      ${styles.blueFilter}
    }
  }
`;

const PopoverContent = styled.div`
  color: ${colors.black};
  font-family: LinearSans;
  font-size: 13px;
  letter-spacing: 0;
  line-height: 18px;
  background-color: ${colors.white};
  width: 100vw;
  height: ${({ height }: { height: number | null }) =>
    height ? `${height * 0.9 - 60}px` : "calc(90vh - 60px)"};
  padding: 12px 20px;
  border-top: 1px solid ${colors.darkPurple};
  border-bottom: 2px solid ${colors.darkPurple};
  box-sizing: border-box;
  overflow-y: auto;
  max-height: 400px;
  overflow-y: scroll;

  @media (orientation: landscape) {
    height: ${({ height }: { height: number | null }) =>
      height ? `${height * 0.8 - 60}px` : "calc(80vh - 60px)"};
  }

  @media (min-width: ${size.tablet}) {
    border: 1px solid ${colors.darkPurple};
    width: 300px;
    height: auto;
  }

  p {
    font-size: 21x;
    line-height: 34px;
    margin: 13px 0;

    @media (min-width: ${size.tablet}) {
      font-size: 13px;
      line-height: 18px;
    }
  }
`;

function Info({ text }: Props): JSX.Element {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const windowHeight = useWindowHeight();
  const isTablet = useMediaQuery({
    query: `(min-width: ${size.tablet})`,
  });

  return (
    <Container>
      <Popover
        containerStyle={{ zIndex: "100", top: "-23px" }}
        isOpen={isPopoverOpen}
        positions={["right"]}
        align="start"
        onClickOutside={() => setIsPopoverOpen(false)}
        content={({ position, childRect, popoverRect }) => (
          <ArrowContainer
            position={position}
            childRect={childRect}
            popoverRect={popoverRect}
            arrowColor={colors.darkPurple}
            arrowSize={isTablet ? 10 : 0}
          >
            <ArrowContainer
              position={position}
              childRect={childRect}
              popoverRect={popoverRect}
              arrowColor={colors.white}
              arrowSize={10}
              style={{ padding: 0 }}
              arrowStyle={{
                borderRight: `14px solid ${colors.white}`,
                borderBottom: `14px solid ${colors.white}`,
                top: "25px",
                left: "4px",
                borderTop: "0px solid transparent",
                borderLeft: "0px solid transparent",
                transform: "rotate(135deg)",
              }}
            >
              <PopoverContent
                height={windowHeight}
                dangerouslySetInnerHTML={{ __html: text || "" }}
              />
            </ArrowContainer>
          </ArrowContainer>
        )}
      >
        <InfoButton
          isPopoverOpen={isPopoverOpen}
          onClick={() => setIsPopoverOpen(!isPopoverOpen)}
        />
      </Popover>
    </Container>
  );
}

export default React.memo(Info);
