import styled from "styled-components";

import { colors, size } from "../../consts";
import { LargeButton, StyledDivider } from ".";

type Props = {
  title: string;
  description: string;
  actionName: string;
  onButtonClicked: () => void;
};

const Container = styled.div`
  background-color: ${colors.cream};
  height: 100vh;
  overflow-y: auto;
  display: flex;
  align-items: center;
`;

const Content = styled.div`
  max-width: 70%;
  margin: 0 auto;
  margin-top: 34px;

  @media (min-width: ${size.tablet}) {
    max-width: 50%;
  }

  @media (min-width: ${size.desktop}) {
    max-width: 30%;
  }
`;

const Title = styled.h1`
  color: ${colors.black};
  font-size: 24px;
  letter-spacing: 0;
  text-align: center;

  @media (min-width: ${size.tablet}) {
    font-size: 40px;
  }
`;

const Description = styled.p`
  color: ${colors.darkPurple};
  font-size: 16px;
  letter-spacing: 0;
  line-height: 23px;
`;

const ButtonWrapper = styled.div`
  float: left;

  @media (max-width: ${size.mobile}) {
    button {
      width: 140px;
    }
  }

  @media (max-width: ${size.tablet}) {
    button {
      width: 160px;
    }
  }
`;

const ContentWrapper = styled.div`
  width: 100%;
  padding-bottom: 10%;
`;

const Error = ({ title, description, actionName, onButtonClicked }: Props) => (
  <Container>
    <ContentWrapper>
      <Content>
        <Title>{title}</Title>
      </Content>
      <StyledDivider color={colors.secondaryBlack} />
      <Content>
        <Description>{description}</Description>
      </Content>
      <Content>
        <ButtonWrapper>
          <LargeButton onClick={onButtonClicked}>{actionName}</LargeButton>
        </ButtonWrapper>
      </Content>
    </ContentWrapper>
  </Container>
);

export default Error;
