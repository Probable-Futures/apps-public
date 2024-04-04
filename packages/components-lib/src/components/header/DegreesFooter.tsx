import styled from "styled-components";
import {
  colors,
  degreesOptions,
  DescKeys,
  HEADER_HEIGHT_MOBILE,
} from "@probable-futures/lib/src/consts";
import { TourProps, WarmingScenarioDescs } from "@probable-futures/lib/src/types";

import TourBox from "../TourBox";
import {
  Button,
  ButtonAndSeparator,
  ButtonContainer,
  ButtonContainerProps,
  ButtonLabel,
  DegreesSeparator,
  Info,
  LabelAndInfoContainer,
  PopoverContainer,
  PopoverContent,
  YearLabel,
  StyledCancelICon,
} from "../../styles/warmingScenarioStyles";
import { useTheme } from "../../contexts/ThemeContext";

type Props = {
  degrees: number;
  warmingScenarioDescs: WarmingScenarioDescs;
  showDegreeDescription: boolean;
  showBaselineModal: boolean;
  tourProps?: TourProps;
  degreesFooterText?: any;
  onWarmingScenarioDescriptionCancel?: () => void;
  onWarmingScenarioClick?: (value: number, hasDescription: boolean) => void;
};

const Container = styled.div`
  display: flex;
  flex: 1;
  align-items: flex-end;
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 3;
  height: ${parseInt(HEADER_HEIGHT_MOBILE) + 15}px;
  background: transparent;
  border-bottom: 1px solid ${colors.darkPurple};
`;

const LabelWrapper = styled.div`
  background-color: ${colors.white};
  border-top: 1px solid ${colors.darkPurple};
  height: calc(100% - 15px);
  box-sizing: content-box;
`;

const Label = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  height: 100%;
  border-right: 1px solid ${colors.darkPurple};
  display: flex;
  align-items: center;
  padding-left: 20px;
  min-width: 85px;
  flex: 1;
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
    border-top: 1px solid ${colors.darkPurple};
    height: calc(100% - 15px);
    content: "";
    background-color: ${colors.white};
  }

  @media (max-width: 641px) {
    pointer-events: auto;
  }
`;

const Buttons = styled.div`
  display: flex;
  height: 100%;
  flex: auto;
  justify-content: center;
  border-top: 1px solid ${colors.darkPurple};
  height: calc(100% - 15px);
  pointer-events: auto;
`;

const StyledButton = styled(Button)`
  justify-content: center;
  height: 100%;
  gap: 5px;
`;

const StyledYearLabel = styled(YearLabel)`
  display: flex;
  width: auto;
  justify-content: center;
  margin-bottom: 3px;
`;

const StyledPopoverContainer = styled(PopoverContainer)`
  left: 0;
  display: flex;
  align-items: start;
  justify-content: center;
  z-index: 0;
  bottom: ${HEADER_HEIGHT_MOBILE};
`;

const StyledPopoverContent = styled(PopoverContent)`
  max-width: 543px;
  padding: 64px 16px 55px 16px;
  flex: 1;
`;

const StyledButtonContainer = styled(ButtonContainer)`
  flex-basis: 20%;
  flex-grow: 0;
  min-width: 105px;
  border-top: 6px solid transparent;

  ${({ isActive }: ButtonContainerProps) =>
    isActive &&
    `
    border-top: 6px solid ${colors.purple};
  `};
`;

const TourBoxWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const DegreesFooter = ({
  degrees,
  warmingScenarioDescs,
  showDegreeDescription,
  showBaselineModal,
  tourProps,
  degreesFooterText,
  onWarmingScenarioClick,
  onWarmingScenarioDescriptionCancel,
}: Props) => {
  const { theme, color, backgroundColor } = useTheme();

  const currentDescKey =
    degreesOptions.find((deg) => deg.value === degrees)?.descKey || "description_1c";

  const renderButton = (
    value: number,
    index: number,
    year: string,
    label: string,
    isSelected: boolean,
    descKey: DescKeys,
  ) => {
    const showInfo = isSelected && !showBaselineModal;
    const showYearLabel = !showBaselineModal && index !== 3 && index !== 5;
    return (
      <StyledButton
        disabled={showBaselineModal && value === 0.5}
        onClick={() =>
          onWarmingScenarioClick && onWarmingScenarioClick(value, !!warmingScenarioDescs[descKey])
        }
        showInfo={showInfo}
        style={{ color }}
      >
        <LabelAndInfoContainer showInfo={showInfo}>
          <ButtonLabel showInfo={showInfo}>{label}</ButtonLabel>
          <Info show={showInfo} theme={theme} />
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
          {degreesFooterText ? degreesFooterText.warmingScenariosTitle : "warming scenarios"}:
        </Label>
      </LabelWrapper>
      {warmingScenarioDescs[currentDescKey] && (
        <StyledPopoverContainer isOpen={showDegreeDescription}>
          <StyledCancelICon onClick={onWarmingScenarioDescriptionCancel} />
          <StyledPopoverContent
            dangerouslySetInnerHTML={{
              __html: warmingScenarioDescs[currentDescKey] || "",
            }}
          />
        </StyledPopoverContainer>
      )}
      <ButtonsWrapper>
        <Buttons style={{ color, backgroundColor }}>
          {degreesOptions.map(({ label, value, descKey, year }, index) => {
            const isSelected = showBaselineModal ? value === 0.5 : degrees === value;
            return (
              <ButtonAndSeparator key={label}>
                <StyledButtonContainer
                  isActive={isSelected}
                  showDegreeDescription={showDegreeDescription}
                >
                  {value === 1.5 && tourProps ? (
                    <TourBoxWrapper>
                      <TourBox
                        show={tourProps.isTourActive && tourProps.step === 3}
                        position="top"
                        {...tourProps}
                      >
                        {renderButton(value, index, year, label, isSelected, descKey)}
                      </TourBox>
                    </TourBoxWrapper>
                  ) : (
                    renderButton(value, index, year, label, isSelected, descKey)
                  )}
                </StyledButtonContainer>
                {index < 3 && <DegreesSeparator />}
              </ButtonAndSeparator>
            );
          })}
        </Buttons>
      </ButtonsWrapper>
    </Container>
  );
};

export default DegreesFooter;
