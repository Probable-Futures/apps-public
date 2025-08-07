import styled from "styled-components";
import {
  colors,
  degreesOptions,
  DescKeys,
  TourProps,
  WarmingScenarioDescs,
} from "@probable-futures/lib";

import TourBox from "../TourBox";
import {
  BorderVisibleOnFocus,
  Button,
  ButtonAndSeparator,
  ButtonContainer,
  ButtonContainerProps,
  ButtonProps,
} from "../../styles/warmingScenarioStyles";
import { useTheme } from "../../contexts";
import { ReactComponent as InfoIcon } from "../../assets/icons/info.svg";

type Props = {
  degrees: number;
  warmingScenarioDescs: WarmingScenarioDescs;
  showBaselineModal: boolean;
  tourProps?: TourProps;
  translatedHeader?: any;
  onAboutMapClick?: () => void;
  onWarmingScenarioClick?: (value: number, hasDescription: boolean) => void;
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid ${colors.grey};
  border-radius: 6px;
  color: ${colors.dimBlack};
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex: 1;
  align-items: center;
`;

const Label = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: ${colors.dimBlack};
  opacity: 0.8;
`;

const StyledButton = styled(Button)`
  gap: 4px;
  border-right: 1px solid ${colors.grey};
  position: relative;
  height: 50px;

  span.label-number {
    margin-top: 10px;
  }

  ${({ isLast }: ButtonProps) => isLast && `border-right: 1px solid transparent;`}

  ${({ partialBorder }: ButtonProps) =>
    partialBorder
      ? `
        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: ${colors.grey};
          z-index: 0;
        }`
      : `border-top: 1px solid ${colors.grey};`}
`;

const StyledButtonContainer = styled(ButtonContainer)`
  flex: 1;

  ${({ isActive }: ButtonContainerProps) =>
    isActive &&
    `
    background-color: ${colors.lightPurple};
  `};
`;

const AboutThisMap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-weight: 400;
  font-size: 13px;
  gap: 10px;
  line-height: 12px;

  svg {
    width: 21px;
    height: 20px;
    scale: 0.75;
  }

  &:hover {
    color: ${colors.purple};
    svg {
      path {
        fill: ${colors.purple};
      }
    }
  }

  span {
    text-decoration: underline;
  }
`;

const DegreesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
`;

const YearLabel = styled.span`
  color: ${({ selected }: { selected: boolean }) => (selected ? "inherit" : colors.lightGrey2)};

  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 11px;
  pointer-events: none;
  min-height: 11px;
  position: absolute;
  z-index: 1;
  padding: 0 8px;
  border-radius: 3px;
  padding-bottom: 2px;
  top: 4px;
`;

const Degrees = ({
  degrees,
  warmingScenarioDescs,
  showBaselineModal,
  tourProps,
  translatedHeader,
  onWarmingScenarioClick,
  onAboutMapClick,
}: Props) => {
  const { color, backgroundColor } = useTheme();

  const renderButton = (
    value: number,
    index: number,
    year: string,
    label: string,
    isSelected: boolean,
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
        partialBorder={false}
        selected={isSelected}
        isLast={index === degreesOptions.length - 1}
      >
        {showYearLabel && (
          <YearLabel selected={isSelected}>
            {translatedHeader ? translatedHeader["yearLabel" + index] : year}
          </YearLabel>
        )}
        <BorderVisibleOnFocus
          className="button-focus-border"
          width={index % 2 === 0 ? "80px" : "65px"}
        />
        <span className="label-number">{label}</span>
      </StyledButton>
    );
  };

  return (
    <Container style={{ color, backgroundColor }}>
      <DegreesHeader>
        <Label>
          {translatedHeader ? translatedHeader.warmingScenariosTitle : "Select a warming scenario"}
        </Label>
        <AboutThisMap onClick={onAboutMapClick}>
          <span>{translatedHeader?.aboutThisMap || "About this map"} </span>
          <InfoIcon />
        </AboutThisMap>
      </DegreesHeader>
      <ButtonWrapper>
        {degreesOptions.map(({ label, value, descKey, year }, index) => {
          const isSelected = showBaselineModal ? value === 0.5 : degrees === value;
          return (
            <ButtonAndSeparator key={label}>
              <StyledButtonContainer isActive={isSelected}>
                {value === 1.5 && tourProps ? (
                  <TourBox
                    show={tourProps.isTourActive && tourProps.step === 2}
                    position="bottom"
                    {...tourProps}
                  >
                    {renderButton(value, index, year, label, isSelected, descKey)}
                  </TourBox>
                ) : (
                  renderButton(value, index, year, label, isSelected, descKey)
                )}
              </StyledButtonContainer>
            </ButtonAndSeparator>
          );
        })}
      </ButtonWrapper>
    </Container>
  );
};

export default Degrees;
