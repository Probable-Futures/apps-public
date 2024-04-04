import styled from "styled-components";

const Container = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  background: rgba(0, 0, 0, 0.5);
`;

const MapOverlay = ({ onClick }: { onClick: React.MouseEventHandler<HTMLDivElement> }) => (
  <Container onClick={onClick} />
);

export default MapOverlay;
