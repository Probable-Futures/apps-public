import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import styled from "styled-components";
import Modal from "react-modal";
import Uppy from "@uppy/core";
import { types } from "@probable-futures/lib";
import { useOutletContext } from "react-router-dom";

import {
  DELETE_PF_PARTNER_DATASET,
  GET_PF_PARTNER_DATASETS,
} from "../../../graphql/queries/datasets";
import EmptyDatasets from "./EmptyDatasets";
import UploadFiles from "../../File/UploadFiles";
import {
  ModalClose,
  ModalHeader,
  ModalTitle,
  StyledCloseIcon,
  Pagination,
  Button,
  LargeButton,
} from "../../Common";
import { itemsPerPage } from "../../../consts/dashboardConsts";
import CloseIcon from "../../../assets/icons/dashboard/close.svg";
import { modalStyle } from "../../../shared/styles/styles";
import DashboardTitle from "../../Common/DashboardTitle";
import { GqlResponse, PageInfo } from "../../../shared/types";
import Item from "./Item";

export type DatasetNode = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  originalFile: string;
  uploadId: string;
  processedWithCoordinatesFile?: string;
  isExample: boolean;
};

export type PfDatasetNode = {
  id: number;
  name: string;
  pfDatasetParentCategoryByParentCategory: types.ParentCategory;
  subCategory: string;
};

type PartnerDatasetReponse = {
  viewPartnerDatasets: GqlResponse<DatasetNode> & { totalCount: number } & {
    pageInfo: PageInfo;
  };
};

const ModalContent = styled.div`
  margin-bottom: 20px;
  position: relative;
`;
const UserDatasets = () => {
  const { toggleLoading } = useOutletContext<{
    toggleLoading: (arg: boolean) => {};
  }>();
  const {
    data: partnerDatasets,
    refetch: refetchDatasets,
    loading: loadingDatasets,
  } = useQuery<PartnerDatasetReponse>(GET_PF_PARTNER_DATASETS, {
    variables: {
      offset: 0,
      first: itemsPerPage,
      filter: { isExample: { equalTo: false } },
    },
    fetchPolicy: "no-cache",
    notifyOnNetworkStatusChange: true,
  });
  const [deleteDataset] = useMutation(DELETE_PF_PARTNER_DATASET, {
    onCompleted: () => refetchDatasets(),
  });
  const [uploadDatasetModalOpen, setUploadDatasetModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [offset, setOffset] = useState<number>(0);

  const uppyRef = useRef<Uppy>();

  const onPageChange = useCallback(
    (offset: number) => {
      refetchDatasets({
        first: itemsPerPage,
        offset,
      });
    },
    [refetchDatasets],
  );

  const onDeleteClick = (index: number) => {
    const dataset = partnerDatasets?.viewPartnerDatasets.nodes[index];
    if (dataset) {
      if (window.confirm("Are you sure you want to delete this dataset?")) {
        deleteDataset({
          variables: {
            id: dataset.id,
          },
        });
      }
    }
  };

  const setUppyRef = useCallback((uppy: Uppy) => {
    uppyRef.current = uppy;
  }, []);

  const onUploadDatasetClick = () => {
    setUploadDatasetModalOpen(true);
  };

  const closeModal = useCallback(() => setUploadDatasetModalOpen(false), []);

  const onUploadFinish = useCallback(() => {
    refetchDatasets();
    closeModal();
  }, [closeModal, refetchDatasets]);

  const uploadFiles = useCallback(async () => {
    const uppyInstance = uppyRef.current;
    if (!uppyInstance || uppyInstance.getFiles().length === 0 || isUploading) {
      return;
    }
    try {
      setIsUploading(true);
      await uppyInstance.upload();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  }, [isUploading]);

  useEffect(() => {
    if (loadingDatasets) {
      toggleLoading(true);
    } else {
      toggleLoading(false);
    }
  }, [loadingDatasets, toggleLoading]);

  return (
    <>
      <div>
        <DashboardTitle title="Data You Uploaded">
          <LargeButton onClick={onUploadDatasetClick}>Upload dataset</LargeButton>
        </DashboardTitle>
        {partnerDatasets?.viewPartnerDatasets?.nodes?.length
          ? partnerDatasets.viewPartnerDatasets.nodes.map((dataset, index) => (
              <Item
                key={index}
                index={index}
                name={dataset.name}
                createdAt={dataset.createdAt}
                updatedAt={dataset.updatedAt}
                onDeleteClick={onDeleteClick}
              />
            ))
          : !loadingDatasets && <EmptyDatasets onUploadDatasetClick={onUploadDatasetClick} />}
        {partnerDatasets && partnerDatasets.viewPartnerDatasets.nodes.length > 0 && (
          <Pagination
            total={partnerDatasets.viewPartnerDatasets.totalCount}
            pageInfo={partnerDatasets.viewPartnerDatasets.pageInfo}
            onPageChange={onPageChange}
            isLoading={loadingDatasets}
            offset={offset}
            setOffset={setOffset}
          />
        )}

        <Modal
          isOpen={uploadDatasetModalOpen}
          style={modalStyle}
          onRequestClose={closeModal}
          ariaHideApp={false}
          shouldCloseOnOverlayClick={false}
        >
          <div>
            <ModalHeader>
              <ModalTitle>Upload dataset</ModalTitle>
              <ModalClose onClick={closeModal}>
                <StyledCloseIcon icon={CloseIcon} />
              </ModalClose>
            </ModalHeader>
            <ModalContent>
              <UploadFiles setUppyRef={setUppyRef} onUploadFinish={onUploadFinish} />
            </ModalContent>
            <Button onClick={uploadFiles} isDisabled={isUploading}>
              Upload File
            </Button>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default UserDatasets;
