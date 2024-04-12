import styled from "styled-components";

const HeaderDiv = styled.div`
  font-family: LinearSans, Arial, Helvetica, sans-serif;
  border: 1px solid #2a172d;
  background-color: #fdfdfd;
  padding: 15px 10px;
  position: absolute;
  font-size: 16px;
  top: 36px;
  left: 55px;
  margin-right: 40px;
  display: inline-block;
  z-index: 1;
`;

const HeaderTitle = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  line-height: 11px;
  text-transform: uppercase;
  margin-bottom: 5px;
`;

const HeaderDesc = styled.p`
  margin: 0;
  font-size: 18px;
  font-weight: bold;
`;

const ScreenshotHeader = ({ datasetName, degrees }: { datasetName: string; degrees: number }) => (
  <HeaderDiv>
    <HeaderTitle>CLIMATE MAP</HeaderTitle>
    <HeaderDesc>{`${datasetName} in a ${degrees}°C warming scenario`}</HeaderDesc>
  </HeaderDiv>
);

export default ScreenshotHeader;
