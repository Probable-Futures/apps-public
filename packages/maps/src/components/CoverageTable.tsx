import styled from "styled-components";
import camelcase from "lodash.camelcase";
import { types } from "@probable-futures/lib";

import { colors } from "../consts";
import { useTranslation } from "../contexts/TranslationContext";
import { getMapCoverage } from "../utils/mapCoverage";

type Props = {
  datasets: types.Map[];
};

/** The versions the table reports on, in column order. */
const REPORTED_VERSIONS = [3, 4];

const Container = styled.div`
  padding: 16px 20px 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 18px;
  color: ${colors.darkPurple};

  th,
  td {
    padding: 7px 8px;
    border-bottom: 1px solid ${colors.lightGrey};
  }

  /* The name column takes what is left; the marks stay narrow and centred. */
  th:first-child,
  td:first-child {
    width: 100%;
    text-align: left;
  }

  th:not(:first-child),
  td:not(:first-child) {
    width: 96px;
    text-align: center;
    white-space: nowrap;
  }

  thead th {
    position: sticky;
    top: 0;
    background-color: ${colors.white};
    border-bottom: 1px solid ${colors.grey};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${colors.lightGrey2};
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const DatasetId = styled.span`
  font-family: "RelativeMono";
  font-size: 11px;
  color: ${colors.lightGrey2};
  margin-left: 8px;
`;

const Mark = styled.span`
  color: ${({ present }: { present: boolean }) =>
    present ? colors.darkPurple : colors.secondaryGray};
`;

const CoverageTable = ({ datasets }: Props): JSX.Element => {
  const { translate } = useTranslation();
  const rows = getMapCoverage(datasets);

  const yes = translate("menu.data.coverage.available", "available");
  const no = translate("menu.data.coverage.unavailable", "not available");
  const absoluteLabel = translate("menu.data.changeViewOptions.absolute", "Absolute");

  const renderMark = (present: boolean) => (
    <Mark present={present} role="img" aria-label={present ? yes : no}>
      {present ? "✓" : "—"}
    </Mark>
  );

  return (
    <Container>
      <Table>
        <thead>
          <tr>
            <th scope="col">{translate("menu.data.coverage.map", "Map")}</th>
            {REPORTED_VERSIONS.map((version) => (
              <th key={version} scope="col">{`v${version}`}</th>
            ))}
            <th scope="col">{translate("menu.data.coverage.era5", "ERA5")}</th>
            {REPORTED_VERSIONS.map((version) => (
              <th key={`absolute-${version}`} scope="col">{`${absoluteLabel} v${version}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ datasetId, slug, name, versions, hasEra5, absoluteVersions }) => (
            <tr key={datasetId}>
              <th scope="row">
                {translate(`header.datasets.${camelcase(slug)}`, name)}
                <DatasetId>{datasetId}</DatasetId>
              </th>
              {REPORTED_VERSIONS.map((version) => (
                <td key={version}>{renderMark(versions.includes(version))}</td>
              ))}
              <td>{renderMark(hasEra5)}</td>
              {REPORTED_VERSIONS.map((version) => (
                <td key={`absolute-${version}`}>
                  {renderMark(absoluteVersions.includes(version))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default CoverageTable;
