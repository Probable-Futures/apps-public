import styled from "styled-components";
import { consts, types } from "@probable-futures/lib";

import { colors } from "../../consts";
import { VersionDiffMap, getDiffPairLabel } from "../../consts/versionDiffMaps";
import { formatDelta } from "./DiffMapKey";

type Props = {
  feature: types.PopupFeature;
  diffMap: VersionDiffMap;
  datasetName: string;
  degrees: number;
  showInspector: boolean;
};

const Body = styled.div`
  padding-bottom: 16px;
  min-width: 200px;
`;

const Title = styled.span`
  display: block;
  max-width: 210px;
  color: ${colors.dimBlack};
  font-size: 12px;
  font-weight: 600;
  line-height: 14px;
  margin-right: 25px;
`;

const PairLabel = styled.div`
  font-family: "RelativeMono", Courier, monospace;
  font-size: 12px;
  color: ${colors.lightGrey2};
  letter-spacing: 0;
  margin: 6px 0 12px;
`;

const Value = styled.div`
  font-family: "RelativeMono", Courier, monospace;
  font-size: 26px;
  line-height: 1;
  letter-spacing: 0;
  color: ${({ sign }: { sign: number }) =>
    sign > 0 ? colors.red : sign < 0 ? colors.blue : colors.darkPurple};
`;

const Unit = styled.span`
  font-size: 13px;
  color: ${colors.lightGrey2};
  margin-left: 6px;
`;

const Range = styled.div`
  font-family: "RelativeMono", Courier, monospace;
  font-size: 11px;
  color: ${colors.lightGrey2};
  letter-spacing: 0;
  margin-top: 8px;
`;

const Coordinates = styled.div`
  font-family: "RelativeMono", Courier, monospace;
  font-size: 11px;
  color: ${colors.lightGrey2};
  letter-spacing: 0;
  margin-top: 10px;
`;

const NoData = styled.div`
  font-size: 13px;
  color: ${colors.lightGrey2};
`;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * The red/blue tiles carry the delta only, not the two source values, so this
 * deliberately does not reuse `PopupContent` — its copy ("12 days above 32°C")
 * would read an absolute claim off a difference. Deltas are also never unit
 * converted: `cToF` adds the 32° offset, which is wrong for a difference.
 */
const DiffPopupContent = ({
  feature,
  diffMap,
  datasetName,
  degrees,
  showInspector,
}: Props): JSX.Element => {
  const [{ label: degreesLabel }] = consts.degreesOptions.filter((d) => d.value === degrees);
  const mid = asNumber(feature.selectedData?.mid);
  const low = asNumber(feature.selectedData?.low);
  const high = asNumber(feature.selectedData?.high);

  return (
    <Body>
      <Title>
        {datasetName} — difference at {degreesLabel}
      </Title>
      <PairLabel>{getDiffPairLabel(diffMap)}</PairLabel>
      {mid === undefined ? (
        <NoData>No data at this location</NoData>
      ) : (
        <>
          <Value sign={Math.sign(mid)}>
            {formatDelta(mid)}
            <Unit>{diffMap.unitLabel}</Unit>
          </Value>
          {low !== undefined && high !== undefined && (
            <Range>
              {formatDelta(low)} to {formatDelta(high)} across the range
            </Range>
          )}
        </>
      )}
      {showInspector && (
        <Coordinates>
          {feature.latitude.toFixed(4)}, {feature.longitude.toFixed(4)}
        </Coordinates>
      )}
    </Body>
  );
};

export default DiffPopupContent;
