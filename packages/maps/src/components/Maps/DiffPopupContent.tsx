import styled, { css } from "styled-components";
import camelcase from "lodash.camelcase";
import { consts, types } from "@probable-futures/lib";

import { colors } from "../../consts";
import { VersionDiffMap, formatDiffValue, getDiffPairLabel } from "../../consts/versionDiffMaps";
import { formatDelta } from "./DiffMapKey";

type Props = {
  feature: types.PopupFeature;
  diffMap: VersionDiffMap;
  dataset: types.Map;
  showInspector: boolean;
  yearLabels?: Record<string, string>;
};

const textStyles = css`
  color: ${colors.black};
  font-weight: 600;
  letter-spacing: 0;
`;

const Title = styled.span`
  display: block;
  max-width: 210px;
  color: ${colors.dimBlack};
  font-size: 12px;
  font-weight: 600;
  line-height: 14px;
  margin-right: 25px;

  &:first-letter {
    text-transform: uppercase;
  }
`;

const Inspector = styled.div`
  display: flex;
  align-items: center;
  font-size: 10px;
  font-style: italic;
  margin-bottom: 10px;
  margin-top: 2px;

  p {
    margin: 0;
  }
`;

const NoDataText = styled.span`
  display: block;
  ${textStyles};
  text-align: center;
  margin-top: 10px;
  margin-bottom: 16px;
  font-size: 20px;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 10px;
  padding-bottom: 18px;
  text-align: center;
  gap: 20px;
`;

const ValueContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  gap: 5px;
`;

const ValueWithNumber = styled.span`
  display: block;
  ${textStyles};
  margin: 18px 0 4px;
  font-size: 20px;
`;

const AvgValue = styled.span`
  display: block;
  ${textStyles};
  font-size: 40px;
  line-height: 1.2;
`;

const Label = styled.span`
  display: block;
  max-width: 80px;
  color: ${colors.black};
  font-size: 10px;
  letter-spacing: 0;
  line-height: 10px;
  text-align: center;
  box-sizing: border-box;
  padding: 0px 4px;

  &:first-letter {
    text-transform: lowercase;
  }
`;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const DiffPopupContent = ({
  feature,
  diffMap,
  dataset,
  showInspector,
  yearLabels,
}: Props): JSX.Element => {
  const rawMid = asNumber(feature.selectedData?.mid);
  const isMidValid =
    rawMid !== undefined && rawMid !== consts.ERROR_VALUE && rawMid !== consts.BARREN_LAND_VALUE;

  const readValue = (raw: unknown) => {
    const value = asNumber(raw);
    return value === undefined || value === consts.ERROR_VALUE || value === consts.BARREN_LAND_VALUE
      ? undefined
      : formatDiffValue(value, diffMap.unitFamily);
  };

  const label = (index: number) => {
    const raw = dataset.dataLabels?.[index];
    return raw ? yearLabels?.[camelcase(raw)] || raw : undefined;
  };

  const values = [
    { value: readValue(feature.selectedData?.low), label: label(0), isMid: false },
    { value: readValue(feature.selectedData?.mid), label: label(1), isMid: true },
    { value: readValue(feature.selectedData?.high), label: label(2), isMid: false },
  ].filter(({ value }) => value !== undefined);

  return (
    <div>
      <Title>{`Difference ${getDiffPairLabel(diffMap)} (${diffMap.unitLabel})`}</Title>
      {showInspector && (
        <Inspector>
          <p>
            Latitude: {Math.trunc(feature.latitude * 100) / 100} | Longitude:{" "}
            {Math.trunc(feature.longitude * 100) / 100}
          </p>
        </Inspector>
      )}
      {!isMidValid ? (
        <NoDataText>No data here</NoDataText>
      ) : (
        <RowContainer>
          {values.map(({ value, label, isMid }, index) => (
            <ValueContainer key={label ?? index}>
              {isMid ? (
                <AvgValue>{formatDelta(value!)}</AvgValue>
              ) : (
                <ValueWithNumber>{formatDelta(value!)}</ValueWithNumber>
              )}
              {label && <Label>{label}</Label>}
            </ValueContainer>
          ))}
        </RowContainer>
      )}
    </div>
  );
};

export default DiffPopupContent;
