import styled from "styled-components";
import { useEffect, useRef, useState } from "react";
import {
  colors,
  degreesOptions,
  DescKeys,
  HEADER_HEIGHT_MOBILE,
  TourProps,
  WarmingScenarioDescs,
} from "@probable-futures/lib";

import TourBox from "../TourBox";
import {
  Button,
  ButtonAndSeparator,
  ButtonContainer,
  ButtonContainerProps,
  DegreesSeparator,
  LabelAndInfoContainer,
} from "../../styles/warmingScenarioStyles";
import { useTheme } from "../../contexts/ThemeContext";

type Props = {
  degrees: number;
  warmingScenarioDescs: WarmingScenarioDescs;
  showBaselineModal: boolean;
  tourProps?: TourProps;
  degreesFooterText?: any;
  onWarmingScenarioClick?: (value: number, hasDescription: boolean) => void;
};

const Container = styled.div`
  display: flex;
  flex: 1;
  align-items: flex-end;
  height: ${parseInt(HEADER_HEIGHT_MOBILE) + 15}px;
  background: transparent;
`;

const LabelWrapper = styled.div`
  background-color: ${colors.white};
  border-top: 1px solid ${colors.grey};
  height: calc(100% - 15px);
  box-sizing: content-box;
`;

const Label = styled.div`
  font-size: 10px;
  font-weight: 400;
  height: 100%;
  border-right: 1px solid ${colors.grey};
  color: ${colors.dimBlack};
  opacity: 0.8;
  display: flex;
  align-items: center;
  padding: 0 15px;
  max-width: 60px;
`;

const ButtonsWrapper = styled.div`
  height: 100%;
  display: flex;
  align-items: flex-end;
  overflow: auto hidden;
  width: 100%;
  box-sizing: content-box;
  &::-webkit-scrollbar {
    display: none;
  }
  // add a white background behind the main div, so when user scrolls all the way
  // to left or the right they would see a white backgroud instead of the seing the map.
  &:after {
    position: absolute;
    z-index: -1;
    bottom: 0;
    left: 0;
    width: 100%;
    height: calc(100% - 15px);
    content: "";
    background-color: ${colors.white};
  }
  @media (max-width: 641px) {
    pointer-events: auto;
  }
`;

const Buttons = styled.div<{ gradientOpacity: number }>`
  display: flex;
  height: 100%;
  flex: auto;
  justify-content: center;
  border-top: 1px solid ${colors.grey};
  height: calc(100% - 15px);
  pointer-events: auto;
  position: relative;

  &::after {
    content: "";
    position: fixed;
    bottom: 0;
    right: -10px;
    width: 63px;
    height: 67px;
    pointer-events: none;
    background: linear-gradient(
      to left,
      rgba(255, 255, 255, ${(props) => props.gradientOpacity}) 0%,
      rgba(255, 255, 255, ${(props) => props.gradientOpacity * 0.9}) 50%,
      rgba(255, 255, 255, ${(props) => props.gradientOpacity * 0.5}) 70%,
      rgba(255, 255, 255, 0) 100%
    );
    transition: opacity 0.3s ease-in-out;
    opacity: ${(props) => props.gradientOpacity};
  }
`;

const StyledButton = styled(Button)`
  justify-content: center;
  height: 100%;
`;

const StyledYearLabel = styled.span`
  color: ${colors.dimBlack};
  opacity: 0.8;
  letter-spacing: 0;
  line-height: 11px;
  pointer-events: none;
  min-height: 11px;
  z-index: 1;
  padding: 0 8px;
  border-radius: 3px;
  display: flex;
  width: auto;
  justify-content: center;
  margin-bottom: 3px;
  font-family: "LinearSans";
  font-size: 10px;
  font-weight: 400;
`;

const StyledButtonContainer = styled(ButtonContainer)`
  flex-basis: 100%;
  flex-grow: 0;
  min-width: 105px;
  border-top: 6px solid transparent;
  ${({ isActive }: ButtonContainerProps) =>
    isActive &&
    `
    background-color: ${colors.lightPurple};
  `};
`;

const TourBoxWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const DegreesFooter = ({
  degrees,
  warmingScenarioDescs,
  showBaselineModal,
  tourProps,
  degreesFooterText,
  onWarmingScenarioClick,
}: Props) => {
  const { color, backgroundColor } = useTheme();
  const [gradientOpacity, setGradientOpacity] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lastButtonRef.current || !scrollContainerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isFullyVisible = entry.intersectionRatio >= 0.8;
        setGradientOpacity(isFullyVisible ? 0 : 1);
      },
      {
        root: scrollContainerRef.current,
        threshold: [0, 0.5, 0.8, 1],
      },
    );
    observer.observe(lastButtonRef.current);
    return () => observer.disconnect();
  }, []);

  const renderButton = (
    value: number,
    index: number,
    year: string,
    label: string,
    descKey: DescKeys,
  ) => {
    const showYearLabel = !showBaselineModal;
    return (
      <StyledButton
        disabled={showBaselineModal && value === 0.5}
        onClick={() =>
          onWarmingScenarioClick && onWarmingScenarioClick(value, !!warmingScenarioDescs[descKey])
        }
        style={{ color }}
      >
        <LabelAndInfoContainer>
          <label>{label}</label>
        </LabelAndInfoContainer>
        <StyledYearLabel>
          {showYearLabel ? (degreesFooterText ? degreesFooterText["yearLabel" + index] : year) : ""}
        </StyledYearLabel>
      </StyledButton>
    );
  };

  return (
    <Container>
      <LabelWrapper style={{ color, backgroundColor }}>
        <Label>
          {degreesFooterText
            ? degreesFooterText.warmingScenariosTitle
            : "Select a warming scenario"}
        </Label>
      </LabelWrapper>

      <ButtonsWrapper ref={scrollContainerRef}>
        <Buttons style={{ color, backgroundColor }} gradientOpacity={gradientOpacity}>
          {degreesOptions.map(({ label, value, descKey, year }, index) => {
            const isSelected = showBaselineModal ? value === 0.5 : degrees === value;
            const isNextSelected = showBaselineModal
              ? index === 0 && value === 0.5
              : degreesOptions[index + 1] && degreesOptions[index + 1].value === degrees;
            const isLastButton = index === degreesOptions.length - 1;
            return (
              <ButtonAndSeparator key={label}>
                <StyledButtonContainer
                  isActive={isSelected}
                  ref={isLastButton ? lastButtonRef : undefined}
                >
                  {value === 1.5 && tourProps ? (
                    <TourBoxWrapper>
                      <TourBox
                        show={tourProps.isTourActive && tourProps.step === 2}
                        position="top"
                        {...tourProps}
                      >
                        {renderButton(value, index, year, label, descKey)}
                      </TourBox>
                    </TourBoxWrapper>
                  ) : (
                    renderButton(value, index, year, label, descKey)
                  )}
                </StyledButtonContainer>
                {
                  <DegreesSeparator
                    hide={index === degreesOptions.length - 1 || isSelected || isNextSelected}
                  />
                }
              </ButtonAndSeparator>
            );
          })}
        </Buttons>
      </ButtonsWrapper>
    </Container>
  );
};

export default DegreesFooter;
