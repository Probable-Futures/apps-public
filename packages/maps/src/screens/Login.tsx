import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import ErrorIcon from "@probable-futures/components-lib/src/assets/icons/error.svg";

import { colors } from "../consts";
import GradientLogo from "../assets/icons/logo-gradient.svg";

const Container = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${colors.whiteSmoke};
`;

const Content = styled.div`
  position: relative;
  padding: 37px 0 51px;
  width: 500px;
  border-radius: 2px;
  background-color: ${colors.white};
  box-shadow: 0 7px 11px -10px rgba(0, 0, 0, 0.5);
  text-align: center;
  margin-bottom: 150px;
`;

const Title = styled.h1`
  color: ${colors.darkPurple};
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0;
  margin-top: 20px;
  margin-bottom: 33px;
`;

const Button = styled.button`
  border-radius: 2px;
  background-color: ${colors.blue};
  color: ${colors.white};
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
  border: none;
  padding: 14px 69px;
  cursor: pointer;
`;

const LogoContainer = styled.div`
  height: 43px;
  background-repeat: no-repeat;
  background-size: auto 100%;
  background-position: right center;
  background-image: url(${GradientLogo});
  width: calc(50% + 104px);
`;

const ErrorTitle = styled.p`
  font-weight: 600;
`;

const ErrorBox = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  transform: translateY(52px);
  display: flex;
  background-color: ${colors.white};
  border: 2px solid ${colors.red};
  margin-top: 22px;
  padding: 13px 16px 12px 13px;
  box-sizing: border-box;

  p {
    color: ${colors.darkPurple};
    font-size: 14px;
    letter-spacing: 0;
    line-height: 16px;
    margin: 0;
    text-align: left;
  }

  ${ErrorTitle} {
    margin-bottom: 10px;
  }
`;

const Error = styled.i`
  background-image: url(${ErrorIcon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 16px;
  height: 16px;
  margin-right: 8px;
  margin-top: 2px;
  flex-shrink: 0;
`;

export function Logo(): JSX.Element {
  return (
    <LogoContainer>
      <svg height="100%" width="calc(100% - 960px)">
        <line
          x1="10"
          y1="26.3px"
          x2="100%"
          y2="26.3px"
          style={{ stroke: colors.purple, strokeWidth: "2px" }}
        />
      </svg>
    </LogoContainer>
  );
}

export default function Login(): JSX.Element {
  const { isAuthenticated, loginWithRedirect, error } = useAuth0();
  const { search } = useLocation();

  return isAuthenticated ? (
    <Navigate to="mapBuilder" replace />
  ) : (
    <Container>
      <Content>
        <Logo />
        <Title>Map Builder</Title>
        <Button
          onClick={() =>
            loginWithRedirect(error?.message === "Access denied." ? { prompt: "login" } : {})
          }
        >
          Sign In
        </Button>
        {search.includes("error=") && (
          <ErrorBox>
            <Error />
            <div>
              <ErrorTitle>The email address you used to sign in is not registered.</ErrorTitle>
              <p>
                Please try again with a registered email address. If you think the email address you
                used should be registered, please reach out to your contact at Probable Futures.
              </p>
            </div>
          </ErrorBox>
        )}
      </Content>
    </Container>
  );
}
