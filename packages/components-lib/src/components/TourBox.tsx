import { Popover, ArrowContainer, PopoverPosition } from "react-tiny-popover";
import styled from "styled-components";
import { types, colors } from "@probable-futures/lib";

import QuizIcon from "../assets/icons/quiz.svg";

type Props = {
  show?: boolean;
  position?: PopoverPosition;
  padding?: number;
  children?: any;
  showContentOnly?: boolean;
} & types.TourProps;

const Container = styled.div`
  ${({ showContentOnly }: { showContentOnly?: boolean }) =>
    showContentOnly &&
    `
    position: absolute;
    top: 20%;
    left: calc(50% - 138px);
  `};
  width: 276px;
  border: 1px solid ${colors.grey};
  border-radius: 6px;
  background-color: ${colors.lightCream};
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
  padding: 10px 22px 10px 23px;
  box-sizing: border-box;
`;

const Content = styled.div`
  p {
    color: ${colors.black};
    font-size: 13px;
    letter-spacing: 0;
    line-height: 14px;
    margin: 10px 0;

    &:first-child {
      font-size: 16px;
      line-height: 20px;
    }
  }

  a {
    color: ${colors.darkPurple};
  }
`;

const RowContainer = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 20px;
`;

const Step = styled.span`
  color: ${colors.black};
  font-family: "RelativeMono";
  font-size: 12px;
  letter-spacing: 0;
  line-height: 20px;
`;

const NextButton = styled.button`
  border-radius: 25px;
  background-color: #8929ff;
  border: none;
  outline: 0;
  cursor: pointer;
  color: ${colors.white};
  font-family: "LinearSans";
  font-size: 16px;
  letter-spacing: 0;
  line-height: 18px;
  padding: 6px 20px;
  margin-right: -12px;
`;

const TourBox = ({
  show = true,
  position = "bottom",
  padding = 5,
  children,
  showContentOnly,
  onClose,
  onNext,
  step,
  steps,
}: Props) => {
  const isLastStep = step + 1 > Object.keys(steps).length - 1;
  const arrowStyles: any = {
    top: {
      bottom: 1,
      borderTop: `10px solid ${colors.lightCream}`,
      zIndex: 1,
    },
    bottom: {
      top: 1,
      borderBottom: `10px solid ${colors.lightCream}`,
      zIndex: 6,
    },
    left: {
      right: 1,
      borderLeft: `10px solid ${colors.lightCream}`,
      zIndex: 1,
    },
    right: {
      left: 1,
    },
  };

  const getCurrentStep = () => {
    // If there are no stories on the map, skip 3rd step
    return `${step === 3 ? step : step + 1} of ${Object.keys(steps).length - 1}`;
  };

  const parseStep = (currentStep: string) => {
    if (currentStep.includes(":quiz:")) {
      const image = `<img src=${QuizIcon} width="15" height="15" style="margin-bottom: -2px;"/>`;
      return currentStep.replace(":quiz:", image);
    }
    return currentStep;
  };

  const TourContent = () => {
    const currentStep = steps[`tour_part_${step + 1}`] || "";
    return (
      <Container showContentOnly={showContentOnly}>
        <Content dangerouslySetInnerHTML={{ __html: parseStep(currentStep) }} />
        <RowContainer>
          <Step>{getCurrentStep()}</Step>
          <NextButton onClick={() => (isLastStep ? onClose() : onNext())}>
            {isLastStep ? "Close" : "Next"}
          </NextButton>
        </RowContainer>
      </Container>
    );
  };

  return showContentOnly ? (
    <TourContent />
  ) : (
    <Popover
      containerStyle={{ zIndex: "6" }}
      isOpen={show}
      positions={[position]}
      align="center"
      padding={padding}
      content={({ position, childRect, popoverRect }) => (
        <ArrowContainer
          position={position}
          childRect={childRect}
          popoverRect={popoverRect}
          arrowColor={colors.grey}
          arrowSize={10}
        >
          <ArrowContainer
            position={position}
            childRect={childRect}
            popoverRect={popoverRect}
            arrowColor={colors.white}
            arrowSize={10}
            style={{ padding: 0 }}
            arrowStyle={position ? arrowStyles[position] : {}}
          >
            <TourContent />
          </ArrowContainer>
        </ArrowContainer>
      )}
    >
      {children}
    </Popover>
  );
};

export default TourBox;
