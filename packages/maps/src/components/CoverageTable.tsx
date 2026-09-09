import styled from "styled-components";
import camelcase from "lodash.camelcase";
import { types } from "@probable-futures/lib";

import { colors } from "../consts";
import { useTranslation } from "../contexts/TranslationContext";
import { getMapCoverage } from "../utils/mapCoverage";
import { diffModeDescriptors } from "../consts/diffModes";

type Props = {
  datasets: types.Map[];
};

/** The versions the table reports on, in column order. */
const REPORTED_VERSIONS = [3, 4];

const Container = styled.div`
  padding: 16px 20px 20px;
  overflow-x: auto;
`;

const Heading = styled.h3`
  margin: 0 0 8px;
  color: ${colors.darkPurple};
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 20px;
`;

const GuideList = styled.ul`
  margin: 0 0 24px;
  padding-left: 18px;
  color: ${colors.lightGrey2};
  font-size: 13px;
  letter-spacing: 0;
  line-height: 19px;

  li + li {
    margin-top: 8px;
  }
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
    width: 88px;
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
  const differenceLabel = translate("menu.data.coverage.difference", "Diff");

  const renderMark = (present: boolean) => (
    <Mark present={present} role="img" aria-label={present ? yes : no}>
      {present ? "✓" : "—"}
    </Mark>
  );

  return (
    <Container>
      <Heading>{translate("menu.data.dataGuide.title", "What this data is")}</Heading>
      <GuideList>
        <li>
          {translate(
            "menu.data.dataGuide.absolute",
            "Absolute maps show a value. Every warming scenario applies, 0.5°C included.",
          )}
        </li>
        <li>
          {translate(
            "menu.data.dataGuide.change",
            "Change maps show the difference from 0.5°C, so they start at 1°C.",
          )}
        </li>
        <li>
          {translate(
            "menu.data.dataGuide.changeView",
            "Change view switches the same map between the difference and the actual values.",
          )}
        </li>
        <li>
          {translate(
            "menu.data.dataGuide.era5",
            "ERA5 is observed reanalysis. Always absolute, and only reaches 0.5°C and 1°C.",
          )}
        </li>
        <li>
          {translate(
            "menu.data.dataGuide.compare",
            "Side by side needs both maps to be the same kind. Incompatible versions are hidden.",
          )}
        </li>
        <li>
          {translate(
            "menu.data.dataGuide.era5Pairing",
            "A change map can pair with ERA5 only when it has an absolute version.",
          )}
        </li>
        <li>
          {translate(
            "menu.data.dataGuide.diff",
            "Difference maps are built from the change values, so their view is fixed.",
          )}
        </li>
        <li>
          {translate(
            "menu.data.dataGuide.diffEra5",
            "The v3 − ERA5 difference measures the model against observed reanalysis, so it is always shown as absolute values.",
          )}
        </li>
        <li>
          {translate(
            "menu.data.dataGuide.availability",
            "Absolute versions are published per map and per version, so the option is not always there.",
          )}
        </li>
      </GuideList>
      <Heading>{translate("menu.data.coverage.tableTitle", "What's available")}</Heading>
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
            {diffModeDescriptors.map(({ mode, pairLabel }) => (
              <th key={mode} scope="col">{`${differenceLabel} ${pairLabel}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ datasetId, slug, name, versions, hasEra5, absoluteVersions, diffModes }) => (
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
              {diffModeDescriptors.map(({ mode }) => (
                <td key={mode}>{renderMark(diffModes[mode])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default CoverageTable;
