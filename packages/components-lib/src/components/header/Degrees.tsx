import React from "react";
import styled from "styled-components";
import {
  size,
  colors,
  HEADER_HEIGHT,
  degreesOptions,
  DescKeys,
} from "@probable-futures/lib/src/consts";
import { TourProps, WarmingScenarioDescs } from "@probable-futures/lib/src/types";

import TourBox from "../TourBox";
import {
  BorderVisibleOnFocus,
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
  StyledCancelICon,
  YearLabel,
} from "../../styles/warmingScenarioStyles";
import { useTheme } from "../../contexts";
import { sendDataToChatbot } from "../../../../maps/src/utils/chatbot";

type Props = {
  degrees: number;
  warmingScenarioDescs: WarmingScenarioDescs;
  showDegreeDescription: boolean;
  showBaselineModal: boolean;
  tourProps?: TourProps;
  headerText?: any;
  onWarmingScenarioDescriptionCancel?: () => void;
  onWarmingScenarioClick?: (value: number, hasDescription: boolean) => void;
};

const Container = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
  padding-left: 16px;
  height: 100%;

  @media (min-width: ${size.desktop}) {
    padding-left: 24px;
  }
`;

const Label = styled.span`
  font-size: 10px;
  font-weight: 600;
  max-width: 82px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-right: 16px;

  @media (min-width: ${size.desktop}) {
    width: 90px;
    margin-right: 4px;
  }
`;

const StyledButton = styled(Button)`
  gap: 4px;
`;

const StyledButtonContainer = styled(ButtonContainer)`
  flex: 1;
  border-bottom: 6px solid transparent;

  ${({ isActive }: ButtonContainerProps) =>
    isActive &&
    `
    border-bottom: 6px solid ${colors.purple};
  `};

  &::after,
  &::before {
    @media (min-width: ${size.tabletMax}) {
      rotate: 90deg;
    }
  }

  &::before {
    @media (min-width: ${size.tabletMax}) {
      top: ${HEADER_HEIGHT};
    }
  }

  &::after {
    @media (min-width: ${size.tabletMax}) {
      top: ${HEADER_HEIGHT};
    }
  }
`;

const StyledYearLabel = styled(YearLabel)`
  margin-top: 8px;
`;

const StyledPopoverContainer = styled(PopoverContainer)`
  z-index: -1;
  top: ${HEADER_HEIGHT};
`;

const StyledPopoverContent = styled(PopoverContent)`
  max-width: 787px;
  padding: 25px 0px 41px 0px;
`;

const Degrees = ({
  degrees,
  warmingScenarioDescs,
  showDegreeDescription,
  showBaselineModal,
  tourProps,
  headerText,
  onWarmingScenarioClick,
  onWarmingScenarioDescriptionCancel,
}: Props) => {
  const currentDescKey =
    degreesOptions.find((deg) => deg.value === degrees)?.descKey || "description_1c";
  const { theme, color } = useTheme();

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
        onClick={() => {
          onWarmingScenarioClick && onWarmingScenarioClick(value, !!warmingScenarioDescs[descKey]);
          sendDataToChatbot({
            warmingScenario: value,
            action: "fetchData",
          });
        }}
        showInfo={showInfo}
        style={{ color }}
      >
        <StyledYearLabel>
          {showYearLabel ? (headerText ? headerText["yearLabel" + index] : year) : ""}
        </StyledYearLabel>
        <BorderVisibleOnFocus
          className="button-focus-border"
          width={index % 2 === 0 ? "80px" : "65px"}
        />
        <LabelAndInfoContainer showInfo={showInfo} className="label-and-info-container">
          <ButtonLabel showInfo={showInfo}>{label}</ButtonLabel>
          <Info show={showInfo} theme={theme} />
        </LabelAndInfoContainer>
      </StyledButton>
    );
  };

  return (
    <Container>
      <Label>{headerText ? headerText.warmingScenariosTitle : "warming scenarios"}:</Label>
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
      {degreesOptions.map(({ label, value, descKey, year }, index) => {
        const isSelected = showBaselineModal ? value === 0.5 : degrees === value;
        return (
          <ButtonAndSeparator key={label}>
            <StyledButtonContainer
              isActive={isSelected}
              showDegreeDescription={showDegreeDescription}
            >
              {value === 1.5 && tourProps ? (
                <TourBox
                  show={tourProps.isTourActive && tourProps.step === 3}
                  position="bottom"
                  {...tourProps}
                >
                  {renderButton(value, index, year, label, isSelected, descKey)}
                </TourBox>
              ) : (
                renderButton(value, index, year, label, isSelected, descKey)
              )}
            </StyledButtonContainer>
            {index < 3 && <DegreesSeparator />}
          </ButtonAndSeparator>
        );
      })}
    </Container>
  );
};

export default Degrees;
