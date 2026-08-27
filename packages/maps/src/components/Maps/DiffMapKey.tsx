import styled from "styled-components";

import { colors, size } from "../../consts";
import { VersionDiffMap, getDiffPairLabel } from "../../consts/versionDiffMaps";

type Props = {
  diffMap: VersionDiffMap;
  title: string;
  stops: number[];
  binHexColors: string[];
};

const Container = styled.div`
  background-color: ${colors.white};
  border-bottom: 1px solid ${colors.grey};
  box-sizing: initial;
  min-width: 520px;
`;

const Content = styled.div`
  display: block;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
`;

const Label = styled.span`
  color: ${colors.darkPurple};
  font-family: LinearSans;
  font-size: 13px;
  line-height: 1.2;
`;

const PairLabel = styled.span`
  font-family: "RelativeMono", Courier, monospace;
  color: ${colors.lightGrey2};
  font-size: 11px;
  letter-spacing: 0;
  white-space: nowrap;
`;

const BinsContainer = styled.div`
  display: flex;
  align-items: flex-start;
  width: 100%;
  gap: 8px;
`;

const BinContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 66px;
`;

const Color = styled.div`
  height: 8px;
  background-color: ${({ value }: { value: string }) => value};
  box-sizing: border-box;

  @media (min-width: ${size.laptop}) {
    height: 14px;
  }
`;

const Bin = styled.span`
  font-family: "RelativeMono", Courier, monospace;
  color: ${colors.darkPurple};
  font-size: 10px;
  letter-spacing: 0;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
  margin-top: 4px;

  @media (min-width: ${size.laptop}) {
    font-size: 12px;
    margin-top: 6px;
  }
`;

const Direction = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-family: LinearSans;
  font-size: 11px;
  color: ${colors.lightGrey2};
`;

export const formatDelta = (value?: number): string => {
  if (value === undefined || !Number.isFinite(value)) {
    return "";
  }
  return value > 0 ? `+${value}` : value.toString();
};

const DiffMapKey = ({ diffMap, title, stops, binHexColors }: Props): JSX.Element => {
  const renderBinLabel = (index: number) => {
    if (index === 0) {
      return `< ${formatDelta(stops[0])}`;
    }
    if (index === binHexColors.length - 1) {
      return `≥ ${formatDelta(stops[stops.length - 1])}`;
    }
    return `${formatDelta(stops[index - 1])} to ${formatDelta(stops[index])}`;
  };

  return (
    <Container className="diff-map-key-container">
      <Content>
        <Header>
          <Label>
            {title} ({diffMap.unitLabel})
          </Label>
          <PairLabel>{getDiffPairLabel(diffMap)}</PairLabel>
        </Header>
        <BinsContainer>
          {binHexColors.map((hexColor, index) => (
            <BinContainer key={`${hexColor}-${index}`}>
              <Color value={hexColor} />
              <Bin>{renderBinLabel(index)}</Bin>
            </BinContainer>
          ))}
        </BinsContainer>
        <Direction>
          <span>← lower in v{diffMap.targetVersion}</span>
          <span>higher in v{diffMap.targetVersion} →</span>
        </Direction>
      </Content>
    </Container>
  );
};

export default DiffMapKey;
