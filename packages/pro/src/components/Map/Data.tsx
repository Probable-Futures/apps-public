import { memo, useEffect, useMemo, useState, FocusEvent } from "react";
import styled from "styled-components";
import { layerConfigChange, removeDataset, updateDatasetProps } from "@kepler.gl/actions";
import { Popover } from "react-tiny-popover";
import { styles } from "@probable-futures/components-lib";
import { utils, consts } from "@probable-futures/lib";
import { useMutation } from "@apollo/client";

import { UPDATE_PARTNER_DATASET_NAME } from "../../store/actions";
import { MAP_ID, supportLayerTypes } from "../../consts/MapConsts";
import { useMapData } from "../../contexts/DataContext";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import PreviewIcon from "../../assets/icons/map/preview.svg";
import EyeOffIcon from "../../assets/icons/map/eye-off.svg";
import useProjectUpdate from "../../utils/useProjectUpdate";
import TrashIcon from "../../assets/icons/map/trash.svg";
import useProjectInit from "../../utils/useProjectInit";
import EyeIcon from "../../assets/icons/map/eye.svg";
import EditIcon from "../../assets/icons/dashboard/pen.svg";
import CheckIcon from "../../assets/icons/dashboard/check.svg";
import { Theme } from "../../shared/styles/styles";
import { Option } from "../../shared/types";
import { colors, size } from "../../consts/";
import { Dropdown } from "../Common";
import Info from "./Info";
import MoreIcon from "../../assets/icons/map/more.svg";
import SmallSpinner from "../Common/SmallSpinner";
import DatasetLoader from "./Common/DatasetLoader";
import ConfirmationModal from "../Common/ConfirmationModal";
import {
  DELETE_PF_PARTNER_PROJECT_DATASET,
  UPDATE_PARTNER_DATASET,
} from "../../graphql/queries/datasets";
import useEnrich from "../../utils/useEnrich";
import { SourceDataCatalogProps } from "@kepler.gl/components";

type Props = {
  onShowDatasetTable: SourceDataCatalogProps["showDatasetTable"];
};

type StyledIconProps = {
  icon: string;
  useWhiteFilter: boolean;
};

const Container = styled.div`
  background-color: ${colors.darkPurpleBackground};
  margin-bottom: 12px;
  border-top: 1px solid #424242;
  border-bottom: 1px solid #424242;
`;

const DataTitle = styled.div`
  display: flex;
  padding: 12px;
  align-items: center;
`;

const ClimateDataWrapper = styled.div`
  display: flex;
  padding: 12px 12px 12px 12px;
`;

const DatasetHeaderContainer = styled.div`
  ${({ first }: { first: boolean }) => !first && "border-top: 1px solid #424242;"}
`;

const DatasetHeader = styled.div`
  display: flex;
  padding: 10px 12px;
  align-items: center;
`;

const TitleText = styled.div`
  height: 20px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0;
  line-height: 20px;
  margin-right: 5px;
`;

const DatasetName = styled.div`
  height: 20px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 12px;
  letter-spacing: 0;
  line-height: 20px;
  margin-right: 5px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`;

const StyledEyeIcon = styled.i`
  display: inline-block;
  background-image: url(${({ isActive }: { isActive: boolean }) =>
    isActive ? EyeIcon : EyeOffIcon});
  background-repeat: no-repeat;
  background-position: center;
  height: 20px;
  width: 20px;
  cursor: pointer;

  :hover {
    ${styles.blueFilter}
  }
  margin-left: auto;
`;

const SliderHeader = styled.div`
  display: flex;
  gap: 5px;
  height: 11px;
  width: 205px;
  color: ${colors.midGrey};
  font-family: LinearSans;
  font-size: 14px;
  letter-spacing: 0;
  line-height: 11px;
  margin-bottom: 8px;
`;

const BinningSelectorWrapper = styled.div`
  padding: 12px;
`;

const StyledIcon = styled.i`
  display: inline-block;
  background-image: url(${({ icon }: StyledIconProps) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  height: 20px;
  width: 20px;
  cursor: pointer;
  ${({ useWhiteFilter }: StyledIconProps) => useWhiteFilter && styles.whiteFilter}

  :hover {
    ${styles.blueFilter}
  }
`;

const IconsWrapper = styled.div`
  display: flex;
  gap: 5px;
  margin-left: auto;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 12px;
  letter-spacing: 0;
  line-height: 20px;

  label {
    cursor: pointer;
    text-decoration: underline;

    :hover {
      color: ${colors.blue};
    }
  }
`;

const PopoverContent = styled.div`
  background-color: ${colors.secondaryBlack};
  color: ${colors.primaryWhite};
`;

const StyledMoreIcon = styled.button`
  position: relative;
  height: 14px;
  width: 14px;
  background-image: url(${MoreIcon});
  background-repeat: no-repeat;
  background-position: center;
  background-color: transparent;
  border: none;
  outline: 0;
  cursor: pointer;
  padding: 0;

  ${({ isPopoverOpen }: { isPopoverOpen: Boolean }) => isPopoverOpen && styles.blueFilter}

  @media (min-width: ${size.laptop}) {
    &:hover {
      ${styles.blueFilter}
    }
  }
`;

const OptionWrapper = styled.div`
  display: flex;
  padding: 8px 16px;
  gap: 5px;
  justify-content: left;
  align-items: center;
  cursor: pointer;

  &:first-child {
    padding-top: 16px;
  }

  &:last-child {
    padding-bottom: 16px;
  }

  &:hover {
    color: ${colors.blue};
    i {
      ${styles.blueFilter}
    }
  }
`;

const StyledTextInput = styled.input`
  background: transparent;
  color: ${colors.primaryWhite};
  border: none;

  :focus {
    outline: 0;
  }
`;

const defaultPercentileDescription =
  "This tool allows you to visualize the range of weather that can be expected in different warming scenarios in any given year: a typical year, 5th percentile year or 95th percentile year. The 5th and 95th percentile values represent unusually warm (or cold, wet, dry, etc.) years, but not extremes, as 10% of outcomes are below the 5th or above the 95th percentiles.";

const moreOptions = [
  {
    id: "edit",
    name: "Edit name",
    icon: EditIcon,
  },
  {
    id: "visibility",
    name: "Hide on map",
    icon: EyeIcon,
  },
  {
    id: "view",
    name: "View as table",
    icon: PreviewIcon,
  },
  {
    id: "remove",
    name: "Remove",
    icon: TrashIcon,
  },
];

const Data = ({ onShowDatasetTable }: Props) => {
  const {
    setIsClimateDataVisible,
    isClimateDataVisible,
    selectedClimateData: activeClimateDataset,
    description9010,
    description955,
  } = useMapData();
  const dispatch = useAppDispatch();
  const layers = useAppSelector((state) => state.keplerGl[MAP_ID]?.visState?.layers);
  const datasets = useAppSelector((state) => state.keplerGl[MAP_ID]?.visState?.datasets);
  const project = useAppSelector((state) => state.project);
  const percentileValue = useAppSelector(
    (state) => state.project.mapConfig?.pfMapConfig?.percentileValue,
  );
  const { updateProject } = useProjectUpdate();
  const { callInit } = useProjectInit();
  const {
    datasetEnrichmentInfo,
    enrichmentMessage,
    enrichmentSubTitle,
    showEnrich,
    showReload,
    showLoading,
    onEnrichClick,
    onReloadClick,
    setDatasetEnrichmentInfo,
    onConfrimEnrich,
  } = useEnrich();
  const [selectedBinning, setSelectedBinning] = useState<Option>();
  const [popoverIndex, setPopoverIndex] = useState(-1);
  const [editingDatasetId, setEditingDatasetId] = useState("");
  const [removeDatasetId, setRemoveDatasetId] = useState("");
  const [updateDatasetName] = useMutation(UPDATE_PARTNER_DATASET);
  const [deleteProjectDataset] = useMutation(DELETE_PF_PARTNER_PROJECT_DATASET, {
    onCompleted: () => {
      if (project.pfDatasetId) {
        callInit(project.projectId, project.pfDatasetId, false);
      }
    },
  });

  const dataValues = useMemo<Option[]>(() => {
    if (activeClimateDataset?.dataLabels) {
      return activeClimateDataset.dataLabels.map((columnName, index) => {
        const value = index === 0 ? "low" : index === 1 ? "mid" : "high";
        return { label: columnName.charAt(0).toUpperCase() + columnName.slice(1), value };
      });
    }
    return [];
  }, [activeClimateDataset]);

  useEffect(() => {
    if (percentileValue) {
      setSelectedBinning({
        value: percentileValue as utils.BinningType,
        label: dataValues.find((dataValue) => dataValue.value === percentileValue)?.label || "",
      });
    }
  }, [percentileValue, dataValues]);

  const defaultBinning = { label: "Average", value: "mid" };
  const toggleLayersVisibility = (datasetId: string) => {
    if (!layers.length) {
      return;
    }

    const datasetLayer = layers.find(
      (layer) =>
        layer.type && supportLayerTypes.includes(layer.type) && layer.config.dataId === datasetId,
    );
    if (datasetLayer) {
      dispatch(
        layerConfigChange(datasetLayer, {
          isVisible: !datasetLayer.config.isVisible,
        }),
      );
    }
  };

  const onRemoveDataset = () => {
    if (removeDatasetId && datasets) {
      const datasetIndex = Object.keys(datasets).findIndex(
        (dataId: string) => dataId === removeDatasetId,
      );
      if (datasetIndex !== -1) {
        const datasetId = project.filteredProjectDatasets[datasetIndex].datasetId;
        deleteProjectDataset({
          variables: {
            projectId: project.projectId,
            datasetId,
          },
        });
        dispatch(removeDataset(removeDatasetId));
      }
      setRemoveDatasetId("");
    }
  };

  const onOptionClick = (id: string, datasetId: string, index: number) => {
    switch (id) {
      case "visibility":
        toggleLayersVisibility(datasetId);
        break;
      case "view":
        onShowDatasetTable && onShowDatasetTable(datasetId);
        break;
      case "remove":
        setRemoveDatasetId(datasetId);
        break;
      case "edit":
        onDatasetNameClicked(datasetId, index);
        break;
      default:
        break;
    }
    setPopoverIndex(-1);
  };

  const updateBinning = (option: Option) => {
    setSelectedBinning(option);
    updateProject({
      mapStyleConfig: { key: "percentileValue", value: option.value as utils.BinningType },
    });
  };

  const onDatasetNameUpdate = (
    event: FocusEvent<HTMLInputElement>,
    index: number,
    datasetId: string,
  ) => {
    const newDatasetName = event.target.value;
    const dataset = project.filteredProjectDatasets[index];
    if (dataset && dataset.datasetName !== newDatasetName) {
      updateDatasetName({
        variables: {
          datasetName: newDatasetName,
          datasetId: dataset.datasetId,
        },
      });
      dispatch({
        type: UPDATE_PARTNER_DATASET_NAME,
        payload: {
          index,
          datasetName: newDatasetName,
        },
      });
      // Keep kepler dataset label and metadata in sync with the updated name.
      if (datasets && datasets[datasetId]) {
        dispatch(
          updateDatasetProps(datasetId, {
            label: newDatasetName,
            metadata: {
              ...datasets[datasetId].metadata,
              label: newDatasetName,
            },
          }),
        );
      }
    }
    setEditingDatasetId("");
  };

  const onDatasetNameClicked = (datasetId: string, index: number) => {
    if (!project.filteredProjectDatasets[index].isExample) {
      setEditingDatasetId(datasetId);
    }
  };

  const getOptionName = (id: string, name: string, datasetId: string) => {
    if (id === "visibility") {
      if (!layers.length) {
        return name;
      }

      const datasetLayer = layers.find(
        (layer: any) => supportLayerTypes.includes(layer.type) && layer.config.dataId === datasetId,
      );

      return datasetLayer?.config.isVisible ? name : name.replace("Hide", "Show");
    }
    return name;
  };

  const percentileDescription = () => {
    if (!description9010 && !description955) {
      return defaultPercentileDescription;
    }
    if (activeClimateDataset?.dataLabels[0] === "5th percentile") {
      return description955;
    }
    return description9010;
  };

  const isDataValueDisabled = (option: Option) => {
    if (!activeClimateDataset || option.value === "mid") {
      return false;
    }
    if (consts.datasetsWithMidValuesOnly.includes(activeClimateDataset.dataset.id)) {
      return true;
    }
    return false;
  };

  const deleteDatasetSubtitle = useMemo(() => {
    if (datasets && removeDatasetId) {
      return datasets[removeDatasetId]?.label || "";
    }
    return "";
  }, [datasets, removeDatasetId]);

  const dropDownIsDisabled =
    project.datasetEnrichment.enrichmentStatus === "in progress" ||
    project.datasetEnrichment.processingStatus === "in progress" ||
    project.isFetchingDatasets;

  return (
    <>
      <Container>
        <DataTitle>
          <TitleText>Your Data</TitleText>
          {(project.isFetchingDatasets || !project.addedDataToMap) && <SmallSpinner />}
        </DataTitle>
        {Object.values(datasets).map((dataset: any, index) => (
          <DatasetHeaderContainer key={dataset.id} first={index === 0}>
            <DatasetHeader>
              {editingDatasetId === dataset.id ? (
                <StyledTextInput
                  type="text"
                  defaultValue={dataset.label}
                  autoFocus
                  onBlur={(event) => onDatasetNameUpdate(event, index, dataset.id)}
                />
              ) : (
                <DatasetName
                  title={dataset.label}
                  onClick={() => onDatasetNameClicked(dataset.id, index)}
                >
                  {dataset.label}
                </DatasetName>
              )}

              <IconsWrapper>
                {editingDatasetId === dataset.id && (
                  <StyledIcon icon={CheckIcon} useWhiteFilter={true} />
                )}
                {!showReload(index) && !showLoading(index) && showEnrich(index) && (
                  <label onClick={() => onEnrichClick(index, dataset.id)}>Enrich</label>
                )}
                {showReload(index) && <label onClick={onReloadClick}>Reload</label>}
                <Popover
                  containerStyle={{ zIndex: "100", top: "5px" }}
                  isOpen={popoverIndex === index}
                  positions={["bottom"]}
                  align="end"
                  onClickOutside={() => setPopoverIndex(-1)}
                  content={() => (
                    <PopoverContent>
                      {moreOptions
                        .filter(
                          // remove the edit dataset name option if it is an example dataset
                          (option) =>
                            option.id !== "edit" ||
                            !project.filteredProjectDatasets[index].isExample,
                        )
                        .map((option) => (
                          <OptionWrapper
                            key={option.id}
                            onClick={() => onOptionClick(option.id, dataset.id, index)}
                          >
                            <StyledIcon icon={option.icon} useWhiteFilter={option.id === "edit"} />
                            <div>{getOptionName(option.id, option.name, dataset.id)}</div>
                          </OptionWrapper>
                        ))}
                    </PopoverContent>
                  )}
                >
                  <StyledMoreIcon
                    isPopoverOpen={popoverIndex === index}
                    onClick={() => setPopoverIndex(index)}
                  />
                </Popover>
              </IconsWrapper>
            </DatasetHeader>
            {showLoading(index) && <DatasetLoader />}
          </DatasetHeaderContainer>
        ))}
      </Container>
      {activeClimateDataset && project.projectId && (
        <Container>
          <ClimateDataWrapper>
            <TitleText>Climate Data</TitleText>
            <StyledEyeIcon
              isActive={isClimateDataVisible}
              onClick={() => {
                setIsClimateDataVisible((val: boolean) => !val);
              }}
            />
          </ClimateDataWrapper>
          <BinningSelectorWrapper>
            <SliderHeader>
              <span>Year type</span>
              <Info text={percentileDescription()} />
            </SliderHeader>
            <Dropdown
              options={dataValues}
              value={selectedBinning ? selectedBinning : defaultBinning}
              onChange={updateBinning}
              theme={Theme.DARK}
              isOptionDisabled={isDataValueDisabled}
              disabled={dropDownIsDisabled}
              loading={dropDownIsDisabled}
            />
          </BinningSelectorWrapper>
        </Container>
      )}
      <ConfirmationModal
        isOpen={datasetEnrichmentInfo !== undefined}
        title="Enrich Dataset"
        message={enrichmentMessage}
        subTitle={enrichmentSubTitle}
        onCancel={() => setDatasetEnrichmentInfo(undefined)}
        onConfirm={onConfrimEnrich}
      />
      <ConfirmationModal
        isOpen={removeDatasetId !== ""}
        title="Remove Dataset"
        message={"You are going to remove this dataset"}
        subTitle={deleteDatasetSubtitle}
        onCancel={() => setRemoveDatasetId("")}
        onConfirm={onRemoveDataset}
      />
    </>
  );
};

export default memo(Data);
