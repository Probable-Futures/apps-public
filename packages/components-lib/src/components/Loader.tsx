import styled from "styled-components";

const Container = styled.div`
  z-index: 6;
  height: 3px;
  position: absolute;
  overflow: hidden;
  border-radius: 20px;
  width: 100%;

  &:before {
    content: "";
    position: absolute;
    left: -50%;
    height: 3px;
    width: 40%;
    background: linear-gradient(90deg, #8929ff 0%, #f1803c 100%);
    animation: lineAnimation 2s linear infinite;
    border-radius: 56px;
  }

  @keyframes lineAnimation {
    0% {
      left: -40%;
    }
    50% {
      left: 20%;
      width: 80%;
    }
    100% {
      left: 100%;
      width: 100%;
    }
  }
`;

const Loader = ({ show }: { show: boolean }) => (show ? <Container /> : null);

export default Loader;
