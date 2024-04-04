import styled from "styled-components";

import WarningIcon from "../../assets/icons/map/warning.svg";

export const ErrorMessageContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 15px;
  color: red;
  font-family: LinearSans;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 16px;
  gap: 5px;
`;

const StyledIcon = styled.i`
  display: inline-block;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 15px;
  height: 15px;
`;

const ErrorMessage = ({ text }: { text: string }) => {
  return (
    <ErrorMessageContainer>
      <StyledIcon icon={WarningIcon}></StyledIcon>
      <span>{text}</span>
    </ErrorMessageContainer>
  );
};

export default ErrorMessage;
