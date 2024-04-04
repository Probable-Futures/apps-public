import React, { useEffect } from "react";
import styled from "styled-components";
import { LinearProgress } from "@material-ui/core";

import { colors } from "../../consts";

const intervalTime = 500;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  box-sizing: border-box;
  background-color: ${colors.white};
  color: ${colors.darkPurple};
  height: 153px;
`;

const InnerContainer = styled.div`
  font-weight: 600;
  letter-spacing: 0;
  line-height: 25px;
  text-align: center;
`;

const Title = styled.p`
  margin-top: 0px;
`;

const BorderLinearProgress = styled(LinearProgress)((_) => ({
  "&.MuiLinearProgress-root": {
    boxSizing: "border-box",
    height: "8px",
    width: "344px",
    border: `1px solid ${colors.darkPurple}`,
    backgroundColor: "transparent",
    margin: "0 auto",
  },
  ".MuiLinearProgress-barColorPrimary": {
    backgroundColor: colors.blue,
  },
}));

const AdditionalInfo = styled.p`
  font-size: 12px;
  line-height: 16px;
  max-width: 293px;
  margin: 24px auto;
`;

// time in ms
type Props = { text: string; additionalInfo?: string; time?: number };

const Loader = ({ text, additionalInfo, time }: Props): JSX.Element => {
  const [progress, setProgress] = React.useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          return 100;
        }
        let diff = Math.random() * 1;
        if (time) {
          diff = 100 / (time / intervalTime);
        }
        return Math.min(oldProgress + diff, 100);
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
    };
  }, [time]);

  return (
    <Container>
      <InnerContainer>
        <Title>{text}</Title>
        <BorderLinearProgress variant="determinate" value={progress} />
        {additionalInfo && <AdditionalInfo>{additionalInfo}</AdditionalInfo>}
      </InnerContainer>
    </Container>
  );
};

export default Loader;
