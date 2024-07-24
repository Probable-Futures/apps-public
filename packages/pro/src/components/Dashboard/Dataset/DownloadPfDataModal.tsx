import { useCallback, useState } from "react";
import styled from "styled-components";
import Modal from "react-modal";
import { types } from "@probable-futures/lib";
import { components } from "@probable-futures/components-lib";

import CloseIcon from "../../../assets/icons/dashboard/close.svg";
import {
  Button,
  Dropdown,
  ModalClose,
  ModalHeader,
  ModalTitle,
  StyledCloseIcon,
} from "../../Common";
import { colors } from "../../../consts";
import { modalStyle, Theme } from "../../../shared/styles/styles";
import { Option } from "../../../shared/types";
import { GeoPlace, IncludeColumnType } from "../../../utils/useDownloadPfData";
import ErrorMessage from "../../Common/ErrorMessage";

export type FileFormatOption = "csv" | "geojson" | "netcdf";

type Props = {
  includeColumns: IncludeColumnType[];
  datasetToDownload: types.Map;
  geoPlaces: GeoPlace[];
  errorMessage: string;
  modalOpen: boolean;
  onDownloadClick: (FileFormatOption: FileFormatOption) => void;
  setGeoPlace: (geoPlace?: GeoPlace) => void;
  setIncludeColumns: (includeColumns: IncludeColumnType[]) => void;
  onModalClose: () => void;
};

const StyledLabel = styled.div`
  color: ${colors.secondaryBlack};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 16px;
  margin-bottom: 8px;
  margin-top: 20px;
`;

const DatasetInfo = styled.p`
  font-size: 14px;
  letter-spacing: 0;
  line-height: 18px;
  width: 90%;
`;

const Checkbox = styled.div`
  position: relative;

  input[type="checkbox"] {
    cursor: pointer;
    position: absolute;
    top: 3px;
  }

  input[type="checkbox"] ~ label {
    margin-left: 5px;
    cursor: pointer;
    padding-left: 20px;
    display: inline-block;
  }
`;

const RadioButtonItem = styled.div`
  margin-bottom: 8px;
  position: relative;
  display: flex;
`;

const InputLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.15;
  align-self: center;
  margin-left: 15px;
  margin-bottom: 0;
`;

const Main = styled.div`
  display: flex;
  justify-content: space-between;
  max-width: 70%;
`;

const Step = styled.div`
  font-size: 12px;
  color: ${colors.secondaryBlack};
  margin-top: 20px;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 20px;
`;

const DownloadPfDataModal = ({
  includeColumns,
  datasetToDownload,
  geoPlaces,
  errorMessage,
  modalOpen,
  setIncludeColumns,
  setGeoPlace,
  onModalClose,
  onDownloadClick,
}: Props) => {
  const [selectedGeoPlace, setSelectedGeoPlace] = useState<Option>();
  const [selectedFormat, setSelectedFormat] = useState<FileFormatOption>("csv");
  const [currentStep, setCurrentStep] = useState<number>(1);

  const getGeoPlaceOptions = useCallback(() => {
    const sortOrder: { [key in GeoPlace["geoPlaceType"]]: number } = {
      country: 1,
      state: 2,
      county: 3,
    };

    // Create a mutable copy of geoPlaces array and sort it based on geoPlaceType
    const sortedGeoPlaces = [...geoPlaces].sort((a, b) => {
      return sortOrder[a.geoPlaceType] - sortOrder[b.geoPlaceType];
    });

    const datasetOptions = sortedGeoPlaces.map((item) => {
      let label = item.name;
      label += `<span style="font-size: 10px;">(${item.geoPlaceType})</span>`;
      if (item.properties) {
        label += "<div>";
        let arrayOfProps: string[] = [];

        Object.keys(item.properties).forEach((propKey) => {
          const propValue = item.properties[propKey];
          arrayOfProps.push(
            `<span style="font-size: 10px;"><b>${propKey}</b>: ${propValue} </span>`,
          );
        });
        label += arrayOfProps.join(", ") + "</div>";
      }
      return {
        label,
        value: item.id,
      };
    });
    datasetOptions.unshift();
    return datasetOptions;
  }, [geoPlaces]);

  const onDatasetChange = (option: Option) => {
    const geoPlace = geoPlaces.find((c) => c.id === option.value);
    setSelectedGeoPlace(option);
    setGeoPlace(geoPlace);
  };

  const onColumChecked = (index: number) => {
    const columns = [...includeColumns];
    columns[index].checked = !columns[index].checked;
    setIncludeColumns(columns);
  };

  const renderDownloadOptions = () => {
    return (
      <div>
        <RadioButtonItem>
          <components.InputRadio
            type="radio"
            name="csv"
            value="CSV"
            onChange={() => setSelectedFormat("csv")}
            checked={selectedFormat === "csv"}
            activeColor={colors.purple}
          />
          <InputLabel>CSV</InputLabel>
        </RadioButtonItem>
        <RadioButtonItem>
          <components.InputRadio
            type="radio"
            name="geojson"
            value="GeoJSON"
            onChange={() => setSelectedFormat("geojson")}
            checked={selectedFormat === "geojson"}
            activeColor={colors.purple}
          />
          <InputLabel>GeoJSON</InputLabel>
        </RadioButtonItem>
        <RadioButtonItem>
          <components.InputRadio
            type="radio"
            name="netcdf"
            value="NetCDF"
            onChange={() => setSelectedFormat("netcdf")}
            checked={selectedFormat === "netcdf"}
            activeColor={colors.purple}
          />
          <InputLabel>NetCDF</InputLabel>
        </RadioButtonItem>
      </div>
    );
  };

  const formatOptionLabel = (data: Option) => (
    <span dangerouslySetInnerHTML={{ __html: data.label }} />
  );

  const renderStepTwoForFiltering = () => (
    <>
      <StyledLabel>
        By default, all data is included, covering most of the world. If you want data only for a
        specific geoPlace, choose it below:
      </StyledLabel>
      <Dropdown
        value={selectedGeoPlace}
        options={getGeoPlaceOptions()}
        onChange={onDatasetChange}
        theme={Theme.LIGHT}
        isSearchable
        placeholder="Select a place (country, state, county..)"
        formatOptionLabel={formatOptionLabel}
      />
      <StyledLabel>Choose columns to include:</StyledLabel>
      <div>
        {includeColumns.map((column, index) => (
          <Checkbox key={column.name}>
            <input
              type="checkbox"
              name="includeLow"
              checked={column.checked}
              onChange={() => onColumChecked(index)}
              id={column.name}
            />
            <label htmlFor={column.name}>{column.label}</label>
            <br />
          </Checkbox>
        ))}
        {errorMessage && <ErrorMessage text={errorMessage} />}
      </div>
    </>
  );

  const renderModalButtons = () => {
    if (selectedFormat === "csv" && currentStep === 1) {
      return <Button onClick={() => setCurrentStep(2)}>Next</Button>;
    }
    return <Button onClick={() => onDownloadClick(selectedFormat)}>Download</Button>;
  };

  return (
    <Modal isOpen={modalOpen} onRequestClose={onModalClose} ariaHideApp={false} style={modalStyle}>
      <ModalHeader>
        <ModalTitle>Download Data</ModalTitle>
        <ModalClose onClick={onModalClose}>
          <StyledCloseIcon icon={CloseIcon} />
        </ModalClose>
      </ModalHeader>
      <div>
        {currentStep === 1 ? (
          <DatasetInfo>
            You are downloading {datasetToDownload.name} map. What format would you like?
          </DatasetInfo>
        ) : (
          <DatasetInfo>You are downloading {datasetToDownload.name} map.</DatasetInfo>
        )}
        {currentStep === 1 && <Main>{renderDownloadOptions()}</Main>}
        {currentStep === 2 && selectedFormat === "csv" && renderStepTwoForFiltering()}
        <ButtonWrapper>
          {renderModalButtons()}
          {selectedFormat === "csv" && <Step>Step {currentStep} of 2</Step>}
        </ButtonWrapper>
      </div>
    </Modal>
  );
};

export default DownloadPfDataModal;
