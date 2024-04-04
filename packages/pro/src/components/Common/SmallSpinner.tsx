import styled from "styled-components";

const StyledSpinner = styled.div`
  border: 2px solid rgba(29, 155, 240, 0.25); /* Light grey */
  border-top: 2px solid #1d9bf0; /* Blue */
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 2s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const SmallSpinner = () => <StyledSpinner />;

export default SmallSpinner;
