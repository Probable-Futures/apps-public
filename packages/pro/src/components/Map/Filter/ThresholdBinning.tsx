import styled from "styled-components";

import { useMapData } from "../../../contexts/DataContext";
import { useAppSelector } from "../../../app/hooks";

type Props = {
  min: number;
  max: number;
};

type BinColorProps = {
  color: string;
  flexGrow: number;
};

const Container = styled.div`
  background-color: transparent;
`;

const BinsContainer = styled.div`
  display: flex;
  align-items: center;
`;

const BinColor = styled.div`
  height: 12px;
  margin-left: 1px;
  background-color: ${({ color }: BinColorProps) => color};
  flex-grow: ${({ flexGrow }: BinColorProps) => flexGrow};
`;

const ThresholdBinning = ({ min, max }: Props): JSX.Element | null => {
  const { selectedClimateData } = useMapData();
  const bins =
    useAppSelector((state) => state.project.mapConfig?.pfMapConfig?.bins) ||
    selectedClimateData?.stops;

  if (!selectedClimateData || !bins) {
    return null;
  }

  const { binHexColors } = selectedClimateData;

  const flexValue = (index: number) => {
    const prev = bins[index - 1];
    const cur = bins[index];
    let result;

    if (index === 0) {
      result = Math.abs(min - cur);
    } else if (index === binHexColors.length - 1) {
      result = Math.abs(max - prev);
    } else {
      result = Math.abs(cur - prev);
    }

    return result || 1;
  };

  return (
    <Container>
      <BinsContainer>
        {binHexColors.map((color: string, index: number) => (
          <BinColor key={color} color={color} flexGrow={flexValue(index)} />
        ))}
      </BinsContainer>
    </Container>
  );
};

export default ThresholdBinning;
