import { memo } from "react";
import styled from "styled-components";

import { DatasetDescriptionResponse, Map } from "@probable-futures/lib/src/types";

type Props = {
  datasetDescriptionResponse: DatasetDescriptionResponse;
  selectedDataset?: Map;
};

const Container = styled.div`
  a {
    text-decoration: underline;
    cursor: pointer;
  }
`;

const Color = styled.div`
  height: 20px;
  width: 20px;
  background-color: ${({ value }: { value: string }) => value};
`;

const BinContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;

  :last-child {
    margin-bottom: 20px;
  }
`;

const GroupName = styled.h3`
  margin-top: 30px;
  margin-bottom: 5px;
`;

const MapDescription = ({ datasetDescriptionResponse, selectedDataset }: Props) => {
  if (!selectedDataset) {
    return null;
  }

  const renderClimateZoneDescs = () => {
    if (selectedDataset.dataset.unit !== "class") {
      return null;
    }
    let index = 0;
    return datasetDescriptionResponse.climate_zones?.map((group) => {
      return (
        <div key={group.name}>
          <GroupName>{group.name}</GroupName>
          <p dangerouslySetInnerHTML={{ __html: group.description }} />
          {group.list?.map((climateZone) => {
            const color = selectedDataset.binHexColors[index++];
            return (
              <BinContainer key={climateZone.symbol}>
                <Color value={color}></Color>
                <span>{climateZone.name}</span>
              </BinContainer>
            );
          })}
        </div>
      );
    });
  };

  return (
    <Container>
      {datasetDescriptionResponse && (
        <p dangerouslySetInnerHTML={{ __html: datasetDescriptionResponse.dataset_description }}></p>
      )}
      {renderClimateZoneDescs()}
    </Container>
  );
};

export default memo(MapDescription);
