import React, { useMemo } from "react";
import styled from "styled-components";

import { colors } from "../../../consts";
import { DatasetNode } from "../Dataset/UserDatasets";
import FileIcon from "../../../assets/icons/dashboard/file.svg";

type Props = {
  datasets: DatasetNode[];
  selectedDataset: string;
  enrich: boolean;
  onPartnerDatasetSelect: (dataset: DatasetNode) => void;
};

const Container = styled.div`
  border: 1px solid ${colors.grey};
  color: ${colors.darkPurple};
  font-size: 14px;
  letter-spacing: 0;
  line-height: 24px;
  height: 270px;
  overflow-y: auto;

  div {
    cursor: pointer;
  }
`;

const StyledFileIcon = styled.i`
  display: inline-block;
  background-image: url(${FileIcon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 20px;
  height: 30px;
`;

const FileIconWrapper = styled.div`
  width: 5%;
`;

const Row = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 12px 12px;
  gap: 10px;
  background-color: ${({ isSelected }: { isSelected: boolean }) =>
    isSelected ? colors.cream : ""};
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  width: 95%;

  h3,
  p {
    font-size: 14px;
    margin: 0;
  }
`;

const DatasetSelect = ({
  datasets,
  selectedDataset,
  onPartnerDatasetSelect,
  enrich,
}: Props): JSX.Element => {
  const filteredDatasets = useMemo(() => {
    /**
     * If enrich is true, the dataset to select has to be processed,
     * Else show datasets with originalFile field
     */
    const groupedDatasets = datasets.reduce<Record<string, DatasetNode[]>>((prev, curr) => {
      if (prev[curr.id]) {
        prev[curr.id].push(curr);
      } else {
        prev[curr.id] = [curr];
      }
      return prev;
    }, {});
    const filterByPartnerDatasetId = Object.keys(groupedDatasets).filter((datasetId) => {
      if (groupedDatasets[datasetId].length === 0) {
        return false;
      } else {
        if (enrich) {
          return (
            groupedDatasets[datasetId].findIndex(
              (dataset) => dataset.processedWithCoordinatesFile,
            ) !== -1
          );
        } else {
          return groupedDatasets[datasetId].findIndex((dataset) => dataset.originalFile) !== -1;
        }
      }
    });
    return filterByPartnerDatasetId.map((datasetId) => groupedDatasets[datasetId][0]);
  }, [datasets, enrich]);

  return (
    <Container>
      {filteredDatasets.map((dataset, index) => (
        <Row
          key={`${dataset.id}_${index}`}
          onClick={() => onPartnerDatasetSelect(dataset)}
          isSelected={selectedDataset === dataset.id}
        >
          <FileIconWrapper>
            <StyledFileIcon />
          </FileIconWrapper>
          <Column>
            <h3>{dataset.name}</h3>
            <p dangerouslySetInnerHTML={{ __html: dataset.description }} />
          </Column>
        </Row>
      ))}
    </Container>
  );
};

export default DatasetSelect;
