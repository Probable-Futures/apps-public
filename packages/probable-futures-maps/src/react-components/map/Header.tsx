import { types } from "@probable-futures/lib";
import styled from "styled-components";

const HeaderContainer = styled.div`
  font-family: LinearSans, Arial, Helvetica, sans-serif;
  border: 1px solid #2a172d;
  background-color: #fdfdfd;
  padding: 15px 10px;
  position: absolute;
  font-size: 16px;
  top: 20px;
  left: 20px;
  margin-right: 40px;
  display: inline-block;
  z-index: 2;
`;

const HeaderTitle = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  line-height: 11px;
  text-transform: uppercase;
  margin-bottom: 5px;
`;

const HeaderDescription = styled.p`
  margin: 0;
  font-size: 18px;
  font-weight: bold;
`;

const Header = ({
  showCompare,
  dataset,
  degrees,
}: {
  showCompare: boolean;
  dataset?: types.Map;
  degrees: number;
}) => {
  const descriptionText = showCompare
    ? dataset?.name
    : `${dataset?.name} in a ${degrees}°C warming scenario`;

  return (
    <HeaderContainer>
      <HeaderTitle>CLIMATE MAP</HeaderTitle>
      <HeaderDescription>{descriptionText}</HeaderDescription>
    </HeaderContainer>
  );
};

export default Header;
