import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import ErrorIcon from "@probable-futures/components-lib/src/assets/icons/error.svg";

import { colors } from "../consts";
import LogoIcon from "../assets/icons/logo-black.svg";

const Container = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${colors.cream};
`;

const Content = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 500px;
  margin-bottom: 150px;
`;

const Button = styled.button`
  height: 40px;
  width: 203px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 16px;
  line-height: 28px;
  cursor: pointer;
  border: none;
  background-color: ${colors.secondaryBlack};
  margin-top: 20px;

  :hover {
    background-color: ${colors.skyBlue};
  }
`;

const SignupLink = styled.a`
  margin-top: 20px;
  font-size: 14px;
  color: ${colors.secondaryBlack};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorTitle = styled.p`
  font-weight: 600;
`;

const ErrorBox = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  transform: translateY(170px);
  display: flex;
  background-color: ${colors.white};
  border: 2px solid ${colors.red};
  margin-top: 22px;
  padding: 13px 16px 12px 13px;
  box-sizing: border-box;

  p {
    color: ${colors.black};
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

const StyledLogo = styled.div`
  height: 60px;
  width: 160px;
  background-image: url(${LogoIcon});
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center;
  margin-bottom: 20px;
`;

export default function Login() {
  const { isAuthenticated, loginWithRedirect, error } = useAuth0();
  const { search } = useLocation();

  return isAuthenticated ? (
    <Navigate to="dashboard" />
  ) : (
    <Container>
      <Content>
        <StyledLogo />
        <Button
          onClick={() =>
            loginWithRedirect(error?.message === "Access denied." ? { prompt: "login" } : {})
          }
        >
          Sign In
        </Button>
        <SignupLink
          href="https://probablefutures.org/pro"
          target="_blank"
          rel="noopener noreferrer"
        >
          Don't have an account? Sign up here.
        </SignupLink>
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
