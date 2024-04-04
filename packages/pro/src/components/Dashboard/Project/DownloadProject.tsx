import { useLazyQuery, useMutation } from "@apollo/client";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import Modal from "react-modal";

import { GET_PF_PARTNER_PROJECT_DATASETS } from "../../../graphql/queries/projects";
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
import { Option, PfPartnerProjectDatasets, ProjectDatasetNode } from "../../../shared/types";
import { GET_DATASET_SIGNED_URLS } from "../../../graphql/queries/datasets";
import { useMapData } from "../../../contexts/DataContext";

type Props = {
  projectId: string | undefined;
  onModalClose: () => void;
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

const ShareLinkInfo = styled.p`
  font-size: 14px;
  letter-spacing: 0;
  line-height: 18px;
  width: 90%;
`;

const DownloadProject = ({ projectId, onModalClose }: Props): JSX.Element => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDatasets, setSelectedDatasets] = useState<Option[]>([
    { label: "All", value: "All" },
  ]);
  const [projectDatasets, setProjectDatasets] = useState<ProjectDatasetNode[]>([]);

  const { selectedClimateData } = useMapData();

  const [loadProjectDatasets] = useLazyQuery<PfPartnerProjectDatasets>(
    GET_PF_PARTNER_PROJECT_DATASETS,
    {
      variables: {
        projectId,
      },
      onCompleted: (data) => {
        const result: ProjectDatasetNode[] = [];
        const datasetsMap = data.viewPartnerProjectDatasets.nodes.reduce<
          Record<string, ProjectDatasetNode>
        >((prev, curr) => {
          if (
            !prev[curr.datasetId] ||
            (prev[curr.datasetId] &&
              !prev[curr.datasetId].enrichedDatasetFile &&
              curr.enrichedDatasetFile &&
              curr.pfDatasetId === selectedClimateData?.dataset.id)
          ) {
            prev[curr.datasetId] = curr;
          }
          return prev;
        }, {});

        Object.keys(datasetsMap).forEach((datasetId) => result.push(datasetsMap[datasetId]));

        setProjectDatasets(result);
      },
    },
  );
  const [getSignedUrls] = useMutation(GET_DATASET_SIGNED_URLS);

  useEffect(() => {
    setModalOpen(projectId !== undefined);
    if (projectId) {
      loadProjectDatasets();
    }
  }, [projectId, loadProjectDatasets]);

  const getDatasetOptions = useCallback(() => {
    const datasetOptions = projectDatasets.map((item) => ({
      label: item.datasetName,
      value: item.datasetId,
    }));
    datasetOptions.unshift({ label: "All", value: "All" });
    return datasetOptions;
  }, [projectDatasets]);

  const closeModal = () => {
    setModalOpen(false);
    onModalClose();
  };

  const downloadDatasets = async () => {
    const isAllSelected = !!selectedDatasets.find(
      (selectedDataset) => selectedDataset.value === "All",
    );
    const fileURls: string[] = projectDatasets
      .filter((node) =>
        isAllSelected
          ? true
          : selectedDatasets.find((selectedDataset) => selectedDataset.value === node.datasetId),
      )
      .map((node) => node.enrichedDatasetFile ?? node.originalFile) as string[];

    const filePaths: string[] = [];
    fileURls.forEach((fileUrl) => {
      const rootUrl = new URL(fileUrl);
      filePaths.push(decodeURIComponent(rootUrl.pathname).substring(1));
    });

    const signedUrls = await getSignedUrls({
      variables: {
        fileUrls: filePaths,
      },
    });

    signedUrls.data?.datasetSignedUrls.forEach((url: string) => {
      window.open(url);
    });
  };

  const onDatasetChange = (options: Option[]) => {
    const allIndex = options.findIndex((option) => option.value === "All");
    if (options.length > 1 && allIndex === options.length - 1) {
      setSelectedDatasets([options[allIndex]]);
    } else if (allIndex !== -1 && allIndex !== options.length - 1) {
      setSelectedDatasets(options.filter((_, index) => index !== allIndex));
    } else {
      setSelectedDatasets(options);
    }
  };

  return (
    <Modal isOpen={modalOpen} onRequestClose={closeModal} ariaHideApp={false} style={modalStyle}>
      <ModalHeader>
        <ModalTitle>Download Your Data</ModalTitle>
        <ModalClose onClick={closeModal}>
          <StyledCloseIcon icon={CloseIcon} />
        </ModalClose>
      </ModalHeader>
      <div>
        <ShareLinkInfo>
          Choose how to export the data. All files will be exported in a CSV file format. Please
          note that if the dataset you want to download is enriched, the enriched file will be
          downloaded. Otherwise, the original file will be downloaded.
        </ShareLinkInfo>
        <StyledLabel>Select datasets to be exported</StyledLabel>
        <Dropdown
          value={selectedDatasets}
          options={getDatasetOptions()}
          onChange={onDatasetChange}
          theme={Theme.LIGHT}
          multi
        />
        <Button onClick={downloadDatasets}>Download</Button>
      </div>
    </Modal>
  );
};

export default DownloadProject;
