import React, { useCallback, useRef, useState } from "react";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import styled from "styled-components";
import Modal from "react-modal";
import Uppy, { UppyFile } from "@uppy/core";

import { Button, ModalClose, ModalHeader, ModalTitle, StyledCloseIcon } from "../../Common";
import CloseIcon from "../../../assets/icons/dashboard/close.svg";
import {
  GET_PARTNER_DATASET_UPLOAD,
  GET_PF_PARTNER_DATASETS,
} from "../../../graphql/queries/datasets";
import UploadFiles, { PartnerDatasetUploadNode } from "../../File/UploadFiles";
import { TabTitle } from "../Header";
import DatasetSelect from "./DatasetSelect";
import { UploadProcessErrorsUI } from "../../../shared/types";
import { CREATE_PF_PARTNER_PROJECT_DATASET } from "../../../graphql/queries/projects";
import { modalStyle } from "../../../shared/styles/styles";
import { DatasetNode } from "../Dataset/Datasets";
import Loader from "../../Common/Loader";
import { useMapData } from "../../../contexts/DataContext";
import { Project } from "../../../utils/projectHelper";
import ErrorMessage from "../../Common/ErrorMessage";
import { colors } from "../../../consts";
import { bytesToString } from "../../../utils";
import { getGeodataType } from "../../../utils/file";
import { DEFAULT_PF_DATASET_ID } from "../../../consts/MapConsts";
import { useAppSelector } from "../../../app/hooks";
import { PartnerDatasetUpload, readUploadErrors } from "../../../utils/DatasetUploadHelper";

type Props = {
  onDatasetUploadFinish: (
    uploadResponse: UploadResponse,
    process: boolean,
    pId: string,
    pfDatasetId?: number,
  ) => void;
  createProject: (
    name: string,
    description: string,
    pfDatasetId: number,
  ) => Promise<Project | undefined>;
};

export type UploadResponse = {
  errors: UploadProcessErrorsUI[];
  datasetUploadNode: PartnerDatasetUploadNode;
};

const StyledLabel = styled.div`
  height: 16px;
  width: 205px;
  color: ${colors.secondaryBlack};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 16px;
  margin-bottom: 8px;
  margin-top: 20px;
`;

const ModalContent = styled.div`
  margin-bottom: 20px;

  hr {
    margin-top: -18px;
    border: none;
    height: 1px;
    background: ${colors.midGrey};
  }
`;

const StyledInput = styled.input`
  box-sizing: border-box;
  height: 40px;
  width: 100%;
  border: 1px solid ${colors.secondaryBlack};
  background-color: ${colors.primaryWhite};
  padding: 0px 14px;
  outline: none;
  margin-bottom: 15px;

  &:active,
  &:focus {
    border: 1px solid #006ec2;
  }
`;

const StyledList = styled.ul`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  list-style-type: none;
  padding: 0;
  height: 100px;
  justify-content: flex-start;
  margin: 0;
  width: 88%;
  height: auto;
  margin-bottom: 16px;
  margin-top: 25px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 16px;
  color: ${colors.darkGrey};
`;

const TabWrapper = styled.div`
  display: ${({ isActive }: { isActive: boolean }) => (isActive ? "block" : "none")};
`;

const mergeDataTabs = ["Add new dataset", "Use data you uploaded", "Use example dataset"];

export type Geodata = "latLon" | "cityCountry" | "fullAddress";

const geodataTypeMessage = `Column labels must specify either latitude and longitude (labeled "lat" and "lon" or
"latitude" and "longitude"), city and country (labeled "city" and "country") or full
address (labeled "address", "city" and "country" plus "postal code" for best results).`;

const MergeData = ({ createProject, onDatasetUploadFinish }: Props): JSX.Element => {
  const [selectedPartnerDataset, setSelectedPartnerDataset] = useState<{
    partnerDatasetId: string;
    uploadId: string;
    originalFile?: string;
  }>();
  const [fileValidationError, setFileValidationError] = useState("");
  const [geodataType, setGeodataType] = useState<Geodata>();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [uppyFilesCount, setUppyFilesCount] = useState(0);
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const uppyRef = useRef<Uppy>();
  const projectId = useAppSelector((state) => state.project.projectId);
  const mapConfig = useAppSelector((state) => state.project.mapConfig);
  const imageUrl = useAppSelector((state) => state.project.imageUrl);
  const projectDatasets = useAppSelector((state) => state.project.projectDatasets);
  const apolloClient = useApolloClient();

  const [createPfPartnerProjectDataset] = useMutation(CREATE_PF_PARTNER_PROJECT_DATASET);
  const { data: partnerDatasets, refetch: refetchPartnerDatasets } = useQuery(
    GET_PF_PARTNER_DATASETS,
    { fetchPolicy: "no-cache" },
  );
  const {
    setShowMergeDataModal,
    showMergeDataModal,
    selectedClimateData: activeClimateDataset,
  } = useMapData();
  const modalTitle = projectId ? "Add Data" : "Create Project";

  const onUploadFinish = useCallback(
    async (datasetUploadResponse: UploadResponse, pId?: string) => {
      pId = pId ?? projectId;
      if (pId && datasetUploadResponse.datasetUploadNode) {
        setSelectedPartnerDataset({
          partnerDatasetId: datasetUploadResponse.datasetUploadNode.partnerDatasetId,
          uploadId: datasetUploadResponse.datasetUploadNode.id,
        });
        createPfPartnerProjectDataset({
          variables: {
            projectId: pId,
            datasetId: datasetUploadResponse.datasetUploadNode.partnerDatasetId,
          },
          onCompleted: () => {
            onDatasetUploadFinish(
              {
                datasetUploadNode: { ...datasetUploadResponse.datasetUploadNode },
                errors: [...datasetUploadResponse.errors],
              },
              geodataType === "cityCountry" || geodataType === "fullAddress",
              pId!,
              activeClimateDataset?.dataset.id,
            );
            refetchPartnerDatasets();
          },
        });
      }
      setFormSubmitted(false);
    },
    [
      activeClimateDataset?.dataset.id,
      projectId,
      geodataType,
      createPfPartnerProjectDataset,
      onDatasetUploadFinish,
      refetchPartnerDatasets,
    ],
  );

  const createPartnerProject = useCallback(async () => {
    if (!projectId) {
      return createProject(projectName, "", DEFAULT_PF_DATASET_ID);
    }
    return {
      id: projectId,
      mapConfig,
      imageUrl,
    };
  }, [createProject, projectName, projectId, imageUrl, mapConfig]);

  const onFileAdded = useCallback(
    async (file: UppyFile) => {
      if (file.extension === "csv") {
        const geodata = await getGeodataType(file);
        setGeodataType(geodata);
      }
      const filesCount = uppyRef.current?.getFiles().length;
      setUppyFilesCount(filesCount || 0);
      if (formSubmitted) {
        setFormSubmitted(false);
      }
    },
    [formSubmitted],
  );

  const onFileRemoved = useCallback(() => {
    const filesCount = uppyRef.current?.getFiles().length;
    setUppyFilesCount(filesCount || 0);
    setFileValidationError("");
  }, []);

  const onUploadError = () => {
    setIsLoading(false);
  };

  const setUppyRef = (uppy: Uppy) => {
    uppyRef.current = uppy;
  };

  const onTabClick = (index: number) => {
    if (currentTab !== index) {
      setCurrentTab(index);
      setSelectedPartnerDataset(undefined);
    }
  };

  const closeModal = () => {
    setShowMergeDataModal(false);
  };

  const onPartnerDatasetSelect = (dataset: DatasetNode) => {
    if (formSubmitted) {
      setFormSubmitted(false);
    }
    if (selectedPartnerDataset?.partnerDatasetId === dataset.id) {
      setSelectedPartnerDataset(undefined);
    } else {
      setSelectedPartnerDataset({
        partnerDatasetId: dataset.id,
        uploadId: dataset.uploadId,
        originalFile: dataset.originalFile,
      });
    }
  };

  const handleInputValue = (e: any) => {
    const { value } = e.target;
    setProjectName(value);
  };

  const getLoaderProcessingInfo = useCallback(() => {
    const uppyFiles = uppyRef.current?.getFiles();
    const loaderProcessingInfo = {
      text: "",
      time: 0,
    };
    if (uppyFiles && uppyFiles.length > 0) {
      const totalSizeInBytes = uppyFiles.reduce((count, file) => count + file.size, 0);
      // Convert total size to MB as we assume every 1 MB will take 0.9 mins
      // set a minimum of 0.5 min no matter how small the file since it is going through the process
      loaderProcessingInfo.time = Math.max((totalSizeInBytes / (1024 * 1024)) * 0.9, 0.5);
      loaderProcessingInfo.text = `Your file
        ${uppyFiles.length > 1 ? "s are " : " is "}
        ${bytesToString(totalSizeInBytes)}. It will take 
        ${Math.round(loaderProcessingInfo.time)} minute(s) to process. 
        Please keep the tab open. Closing the tab will stop the processing.`;
    }
    return loaderProcessingInfo;
  }, []);

  const getDatasetUpload = useCallback(
    async (uploadId: string, projectId: string) => {
      const { data: datasetUpload }: { data: PartnerDatasetUpload } = await apolloClient.query({
        query: GET_PARTNER_DATASET_UPLOAD,
        variables: {
          id: uploadId,
        },
      });
      onUploadFinish(
        {
          errors: readUploadErrors(datasetUpload.viewPartnerDatasetUpload),
          datasetUploadNode: datasetUpload.viewPartnerDatasetUpload,
        },
        projectId,
      );
    },
    [apolloClient, onUploadFinish],
  );

  const uploadFiles = useCallback(
    async (e: React.FormEvent<HTMLFormElement> | undefined) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (formSubmitted) {
        return;
      }
      setFormSubmitted(true);

      const uppyFiles = uppyRef.current?.getFiles();
      if (uppyRef.current && uppyFiles && uppyFiles.length > 0) {
        if (
          geodataType ||
          uppyFiles[0].extension === "json" ||
          uppyFiles[0].extension === "geojson"
        ) {
          setFileValidationError("");
          await createPartnerProject();
          if (uppyFiles.some((f) => f.isPaused && f.progress?.uploadStarted)) {
            uppyRef.current?.resumeAll();
          } else {
            uppyRef.current?.upload().then(() => {});
          }
          if (geodataType === "cityCountry" || geodataType === "fullAddress") {
            setIsLoading(true);
          }
        } else {
          setFileValidationError("Invalid column names");
          setFormSubmitted(false);
        }
      } else if (selectedPartnerDataset?.partnerDatasetId) {
        const data = await createPartnerProject();
        if (selectedPartnerDataset.uploadId && data) {
          getDatasetUpload(selectedPartnerDataset.uploadId, data.id);
        } else {
          setFormSubmitted(false);
        }
      }
    },
    [
      geodataType,
      selectedPartnerDataset?.partnerDatasetId,
      selectedPartnerDataset?.uploadId,
      createPartnerProject,
      getDatasetUpload,
      formSubmitted,
    ],
  );

  const filteredPartnerDatasets = useCallback(
    (excludeExampleDatasets: boolean) => {
      const partnerDatasetNodes: DatasetNode[] = partnerDatasets?.viewPartnerDatasets?.nodes || [];
      // don't include the dataset if it is already added to the project.
      return partnerDatasetNodes.filter(
        (dataset) =>
          (excludeExampleDatasets ? !dataset.isExample : dataset.isExample) &&
          !projectDatasets.find((projectDataset) => projectDataset.datasetId === dataset.id),
      );
    },
    [projectDatasets, partnerDatasets?.viewPartnerDatasets?.nodes],
  );

  return (
    <Modal
      style={{ ...modalStyle, content: { ...modalStyle.content, width: "520px" } }}
      isOpen={showMergeDataModal}
      onRequestClose={closeModal}
      ariaHideApp={false}
      shouldCloseOnOverlayClick={false}
    >
      {isLoading && (
        <Loader
          text="Loading and reading file"
          additionalInfo={getLoaderProcessingInfo().text}
          time={getLoaderProcessingInfo().time * 60 * 1000}
        />
      )}
      <div style={{ display: isLoading ? "none" : "block" }}>
        <ModalHeader>
          <ModalTitle>{modalTitle}</ModalTitle>
          <ModalClose onClick={closeModal}>
            <StyledCloseIcon icon={CloseIcon} />
          </ModalClose>
        </ModalHeader>
        <ModalContent>
          <form onSubmit={uploadFiles}>
            {!projectId && (
              <>
                <StyledLabel>Project name</StyledLabel>
                <StyledInput
                  type="text"
                  name="name"
                  placeholder="Enter name"
                  required
                  autoFocus
                  onChange={handleInputValue}
                />
              </>
            )}
            <Label>{geodataTypeMessage}</Label>
            <StyledList>
              {mergeDataTabs.map((item, index) => (
                <TabTitle
                  key={index}
                  title={item}
                  isHeader={false}
                  isSelected={currentTab === index}
                  onTabClick={onTabClick}
                  index={index}
                />
              ))}
            </StyledList>
            <hr />
            <TabWrapper isActive={currentTab === 0}>
              <UploadFiles
                onUploadError={onUploadError}
                onUploadFinish={onUploadFinish}
                setUppyRef={setUppyRef}
                geodataType={geodataType}
                onFileAdded={onFileAdded}
                onFileRemoved={onFileRemoved}
                process={geodataType === "cityCountry" || geodataType === "fullAddress"}
              />
            </TabWrapper>
            <TabWrapper isActive={currentTab === 1}>
              <DatasetSelect
                datasets={filteredPartnerDatasets(true)}
                onPartnerDatasetSelect={onPartnerDatasetSelect}
                selectedDataset={selectedPartnerDataset?.partnerDatasetId || ""}
                enrich={false}
              />
            </TabWrapper>
            <TabWrapper isActive={currentTab === 2}>
              <DatasetSelect
                datasets={filteredPartnerDatasets(false)}
                onPartnerDatasetSelect={onPartnerDatasetSelect}
                selectedDataset={selectedPartnerDataset?.partnerDatasetId || ""}
                enrich={false}
              />
            </TabWrapper>
            {formSubmitted && uppyFilesCount === 0 && !selectedPartnerDataset?.partnerDatasetId && (
              <ErrorMessage text="Please select a file to upload" />
            )}
            {fileValidationError && uppyFilesCount !== 0 && (
              <ErrorMessage text={fileValidationError} />
            )}
            <Button type="submit" name="upload">
              Import Dataset
            </Button>
          </form>
        </ModalContent>
      </div>
    </Modal>
  );
};

export default MergeData;
