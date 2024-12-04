import styled from "styled-components";
import { colors, size } from "@probable-futures/lib";

const StyledSpinner = styled.div`
  border: 2px solid ${colors.whiteOriginal};
  border-top: 2px solid ${colors.darkPurple};
  border-radius: 50%;
  width: 15px;
  height: 15px;
  animation: spin 2s linear infinite;
  position: absolute;
  right: 3px;

  @media (min-width: ${size.laptop}) {
    width: 12px;
    height: 12px;
    right: 1px;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const Spinner = () => <StyledSpinner />;

export default Spinner;
