import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { Collapse } from "@material-ui/core";

import DashIcon from "../../../assets/icons/map/dash.svg";
import PlusIcon from "../../../assets/icons/map/plus.svg";
import Info from "../Info";
import { useMapData } from "../../../contexts/DataContext";
import { colors } from "../../../consts";
import { useAppSelector } from "app/hooks";
import { MAP_ID } from "../../../consts/MapConsts";

type Props = {
  dataset: any;
  children: JSX.Element | JSX.Element[];
  section: "data" | "mapStyle" | "filters";
  onToggle?: (toggled: boolean) => void;
};

const TitleWrapper = styled.div`
  display: flex;
  color: ${colors.primaryWhite};
  align-items: center;
  margin-bottom: 20px;
  margin-top: 5px;
  gap: 10px;
  label {
    color: ${colors.primaryWhite};
    font-family: LinearSans;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0;
    line-height: 20px;
    margin-right: 5px;
    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
`;

const ToggleButton = styled.button`
  position: relative;
  height: 12px;
  width: 12px;
  background-image: ${({ isToggled }: { isToggled: boolean }) =>
    `url(${isToggled ? DashIcon : PlusIcon})`};
  background-repeat: no-repeat;
  background-position: center;
  background-color: transparent;
  border: none;
  outline: 0;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  width: 90%;
`;

const ButtonWrapper = styled.div`
  width: 10%;
  display: flex;
  align-items: center;
`;

const Container = styled.div`
  position: sticky;
  top: 0;
  background-color: ${colors.secondaryBlack};
  z-index: 10;
  padding-bottom: 1px;
  margin-top: 15px;
`;

const DatasetTitle = ({ dataset, section, children, onToggle }: Props): JSX.Element | null => {
  const [isToggled, setIsToggled] = useState(true);
  const { selectedClimateData, climateData } = useMapData();
  const projectDatasets = useAppSelector((state) => state.project.projectDatasets);
  const filteredProjectDatasets = useAppSelector((state) => state.project.filteredProjectDatasets);
  const datasets = useAppSelector((state) => state.keplerGl[MAP_ID]?.visState?.datasets);

  const datasetEnrichmentStatus = useCallback(
    (datasetId: string) => {
      if (!datasets) {
        return "";
      }
      const index = Object.keys(datasets).indexOf(datasetId);
      if (index === -1) {
        return "";
      }
      const dataset = filteredProjectDatasets[index];
      const datasetUploads = projectDatasets.filter(
        (projectDataset) => projectDataset.datasetId === dataset.datasetId,
      );
      const uniquePfDatasetIds: Set<number> = new Set();
      datasetUploads.forEach((datasetUpload) => {
        if (datasetUpload.pfDatasetId && datasetUpload.enrichedDatasetFile) {
          uniquePfDatasetIds.add(datasetUpload.pfDatasetId);
        }
      });
      const climateDatasetNames: string[] = [];
      uniquePfDatasetIds.forEach((pfDatasetId) => {
        climateDatasetNames.push(
          climateData.find((dataset) => dataset.dataset.id === pfDatasetId)!.name,
        );
      });
      if (climateDatasetNames.length === 0) {
        if (section === "filters") {
          return "This dataset is not enriched. To enable filtering with climate data, click on the Data tab to enrich it with a climate dataset.";
        } else {
          return "This dataset is not enriched.";
        }
      } else {
        let joinDatasetNames = "";
        if (climateDatasetNames.length === 1) {
          joinDatasetNames = "“" + climateDatasetNames[0] + "”";
        } else {
          const firstElements =
            climateDatasetNames
              .slice(0, climateDatasetNames.length - 1)
              .map((dataset) => "“" + dataset + "”")
              .join(", ") + " and ";
          const lastElement = "“" + climateDatasetNames[climateDatasetNames.length - 1] + "”";
          joinDatasetNames = firstElements + lastElement;
        }
        if (section === "filters") {
          return `This dataset is enriched with ${joinDatasetNames}. To filter your data with another climate dataset, select the climate map you are interested in and click the button below to enrich your data with it.`;
        } else {
          return `This dataset is enriched with ${joinDatasetNames}.`;
        }
      }
    },
    [datasets, climateData, filteredProjectDatasets, projectDatasets, section],
  );

  const toggle = () => {
    setIsToggled((val) => !val);
    if (onToggle) {
      onToggle(!isToggled);
    }
  };

  if (!selectedClimateData) {
    return null;
  }

  return (
    <div>
      <Container key={dataset.id}>
        <TitleWrapper>
          <Title>
            <label>{dataset.label}</label>
            <Info text={dataset ? `<div>${datasetEnrichmentStatus(dataset.id)}</div>` : ""} />
          </Title>
          <ButtonWrapper>
            <ToggleButton onClick={toggle} isToggled={isToggled} />
          </ButtonWrapper>
        </TitleWrapper>
      </Container>
      <Collapse in={isToggled}>{children}</Collapse>
    </div>
  );
};

export default DatasetTitle;
