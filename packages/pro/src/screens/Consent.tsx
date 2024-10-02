import { useState } from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";

import LogoIcon from "../assets/icons/logo-black.svg";
import { colors, size } from "../consts";
import { AUTH0_DOMAIN } from "../consts/env";
import ErrorMessage from "../components/Common/ErrorMessage";

const Container = styled.div`
  background-color: ${colors.cream};
  height: 100vh;
`;

const Content = styled.div`
  position: relative;
  height: 100%;
  padding: 20px;
`;

const LoginBox = styled.div`
  max-height: 60%;
  min-height: 50%;
  overflow-y: scroll;
  padding: 50px;
  background-color: ${colors.primaryWhite};
  box-shadow: 0px 5px 5px #ccc;
  border-radius: 5px;
  transform: translateY(20%);
  max-width: 540px;
  margin: 0 auto;
  padding-bottom: 80px;

  .login-header {
    text-align: center;
  }
`;

const StyledLogo = styled.i`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 5%;
  margin-right: 5px;
  height: 60px;
  width: 160px;
  background-image: url(${LogoIcon});
  background-repeat: no-repeat;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  background-position: center;
`;

const Footer = styled.div`
  width: 100%;

  button {
    float: left;
    background-color: ${colors.darkPurple};
    color: ${colors.primaryWhite};
    width: 160px;
    height: 45px;
    font-size: 16px;
    font-weight: 400;
    cursor: pointer;
    border: 0;
    margin-top: 10px;

    @media (min-width: ${size.tablet}) {
      width: 230px;
    }
  }
`;

const ConsentAgreeText = styled.div`
  position: relative;
  margin-bottom: 15px;
  margin-top: 20px;

  input[type="checkbox"] {
    cursor: pointer;
    position: absolute;
    top: 3px;
  }

  input[type="checkbox"] ~ label {
    margin-left: 5px;
    cursor: pointer;
    padding-left: 20px;
    display: inline-block;
  }
`;

const Consent = () => {
  const location = useLocation();
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const proceed = () => {
    setSubmitted(true);
    if (!agreed) {
      return;
    }
    const queryParams = new URLSearchParams(location.search);
    const state = queryParams.get("state");
    if (state) {
      const path = `https://${AUTH0_DOMAIN}/continue?state=${state}&confirm=true`;
      window.location.assign(path);
    }
  };

  return (
    <Container>
      <Content>
        <StyledLogo />
        <LoginBox>
          <div className="login-header">
            <h3>Welcome to Probable Futures Pro</h3>
          </div>
          <div>
            <p>
              Like everything Probable Futures produces, Probable Futures Pro is made available
              without cost or compensation. However, we ask that you agree to the following terms of
              use so we are all on the same page about Probable Futures Pro.
            </p>
            <p>
              Probable Futures states{" "}
              <a
                href="https://probablefutures.org/licensing/"
                target="_blank"
                rel="noopener noreferrer"
              >
                terms of use{" "}
              </a>
              and licensing information on our site. This is a plain language addendum to our
              general terms of use, created for participants in the Probable Futures Pro private
              alpha group. By using the Pro tool, you are both agreeing to Probable Futures general
              terms of use, as well as the full addendum,{" "}
              <a
                href="https://probablefutures.org/pro-alpha-terms/"
                target="_blank"
                rel="noopener noreferrer"
              >
                found here
              </a>
              . This version is solely for ease of communication, but the official addendum is the
              overriding official document. If you do not agree to these terms, please do not
              proceed with using the tool.
            </p>
          </div>
          <div>
            <h4>1. Access to the Site</h4>
            <p>
              You will keep in confidence any access keys or links that you are provided. You are
              responsible for all activities that occur while using our tool. We reserve the right
              to revoke your access at any time, for any reason.
            </p>
            <h4>2. Your content</h4>
            <p>
              Pro allows users to upload geospatial datasets to our tool. If these datasets are
              private property of yours or of your organization’s, you are granting us a license to
              host it on our servers. Probable Futures has no responsibility for any of your content
              or the consequences of you sharing any of your content with others. We have the right,
              but not the obligation, to monitor and edit or remove any of your content from the
              site.
            </p>
            <h4>3. Your responsibility</h4>
            <p>
              This is a voluntary alpha user program, and through membership in the group we ask you
              to: Notify us about any problems with the tool or any recommendations or advice you
              have Request permission to share anything from the tool publicly Not sell your access,
              alter our branding, or disparage our reputation.
            </p>
            <h4>4. Ownership</h4>
            <p>We own the tool and you own your content.</p>
            <h4>5. Support</h4>
            <p>
              We will provide technical support as best we can, and we intend to. However, we aren’t
              under contractual obligation to do so.
            </p>
            <h4>6. No Warranties</h4>
            <p>
              We may or may not end up making the tool public, though it is our intention to do so
              at this time. We reserve the right to sunset the tool, though we don’t intend to do so
              at this time.
            </p>
          </div>
          <Footer>
            <ConsentAgreeText>
              <input
                type="checkbox"
                checked={agreed}
                onChange={() => setAgreed((value) => !value)}
                id="agreed"
                name="agreed"
              />
              <label htmlFor="agreed">
                I have read and agree to the{" "}
                <a
                  href="https://probablefutures.org/pro-alpha-terms/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Probable Futures Pro Tool Alpha User License Terms
                </a>
                .
              </label>
              {submitted && !agreed && (
                <ErrorMessage
                  text={"Please agree to the terms and conditions before you proceed."}
                />
              )}
            </ConsentAgreeText>
            <button onClick={proceed}>Agree & Continue</button>
          </Footer>
        </LoginBox>
      </Content>
    </Container>
  );
};

export default Consent;
