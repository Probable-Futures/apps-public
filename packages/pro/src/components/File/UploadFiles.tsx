import { useState, useRef, useEffect, useCallback } from "react";
import Uppy, { UppyFile, UppyOptions, Meta } from "@uppy/core";
import { Dashboard } from "@uppy/react";

import "@uppy/core/css/style.css";
import "@uppy/progress-bar/dist/style.css";
import "@uppy/dashboard/css/style.css";
import "@uppy/file-input/dist/style.css";
import "@uppy/status-bar/css/style.css";
import "@uppy/drag-drop/css/style.css";

import styled, { css } from "styled-components";
import AwsS3 from "@uppy/aws-s3";
import { useAuth0 } from "@auth0/auth0-react";

import * as env from "../../consts/env";
import UploadIcon from "../../assets/icons/dashboard/dataset-upload.svg";
import { colors } from "../../consts";
import useUploadProcess from "../../utils/useUploadProcess";
import { ProcessingErrors, ProcessingWithCoordinatesErrors } from "../../shared/types";
import { UploadResponse } from "../Dashboard/Project/MergeData";
import { Geodata } from "../Dashboard/Project/MergeData";
import FileIcon from "../../assets/icons/dashboard/file.svg";
import EditIcon from "../../assets/icons/dashboard/pen.svg";
import TrashIcon from "../../assets/icons/dashboard/trash.svg";
import CloseIcon from "../../assets/icons/dashboard/close.svg";
import ErrorMessage from "../Common/ErrorMessage";
import { EnrichStatus } from "../../utils/useEnrichmentProcess";

type Props = {
  onUploadError?: () => void;
  onUploadFinish: (datasetUploadResponse: UploadResponse) => void;
  setUppyRef?: (arg: any) => void;
  onFileAdded?: (file: UppyFile<Meta, Record<string, never>>) => void;
  onFileRemoved?: (file: UppyFile<Meta, Record<string, never>>) => void;
  geodataType?: Geodata;
  process?: boolean;
};

export type PartnerDatasetUploadNode = {
  id: string;
  processingErrors: ProcessingErrors;
  processingWithCoordinatesErrors: ProcessingWithCoordinatesErrors;
  processedWithCoordinatesFile: string;
  processingTimeMs: number;
  processedRowCount: number;
  partnerDatasetId: string;
  processedWithCoordinatesRowCount: number;
  enrich: boolean;
  status?: EnrichStatus;
};

const IconSharedStyles = css`
  visibility: visible;
  display: inline-block;
  content: "";
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
`;

const Container = styled.div<{ isEditing?: boolean }>`
  .uppy-dashboard {
    margin: 0 auto;
    width: 100%;
    position: relative;
    .uppy-Dashboard-AddFiles {
      margin: 0px;
      border-radius: 0px;
      height: 100%;
      font-family: LinearSans;
      border: 1px dashed ${colors.grey};
      background-color: ${colors.cream};
      &-title {
        font-size: 22px;
        font-weight: 600;
        position: absolute;
      }
      &-list {
        flex-direction: row;
        justify-content: center;
        gap: 16px;
      }
      &-info {
        display: block;
        padding-bottom: 50px;
      }
    }
    .uppy-Dashboard-browse {
      color: ${colors.darkPurple};
      font-weight: 600;
      text-decoration: underline;
    }
    .uppy-Dashboard-inner {
      border: none;
      padding: 0px;
      background-color: ${colors.primaryWhite};
    }
    .uppy-Dashboard-innerWrap {
      border-radius: 0px;
    }
    .uppy-Dashboard-note {
      color: ${colors.black};
      font-size: 16px;
      max-width: 400px;
      padding: 0px;
      padding-bottom: 20px;
    }
  }
  .uppy-DashboardTab-btn {
    justify-content: center;
  }
  .uppy-DashboardContent-bar {
    display: ${({ isEditing = false }) => (isEditing ? "none" : "flex")};
    background-color: ${colors.cream};
    border: 1px solid ${colors.secondaryBlack};
    border-bottom: none;
    z-index: 1;
    .uppy-DashboardContent-title,
    .uppy-DashboardContent-addMore {
      display: none;
    }
    .uppy-DashboardContent-back {
      margin-left: auto;
      color: ${colors.darkPurple};
      font-family: LinearSans;
      font-size: 14px;
      letter-spacing: 0;
      line-height: 16px;
      display: flex;
      align-items: center;
      gap: 5px;
      &:before {
        ${IconSharedStyles}
        background-image: url(${CloseIcon});
        width: 12px;
        height: 12px;
      }
    }
  }
  .uppy-Dashboard-files {
    font-family: LinearSans;
    color: ${colors.darkPurple};
    border: 1px solid;
    border-top: none;
    .uppy-Dashboard-filesInner {
      display: block;
    }
    .uppy-Dashboard-Item {
      max-width: unset;
      margin: unset;
      .uppy-Dashboard-Item-preview {
        display: none;
      }
      .uppy-Dashboard-Item-fileInfoAndButtons {
        padding: 10px 20px;
        &:before {
          ${IconSharedStyles}
          background-image: url(${FileIcon});
          height: 45px;
          width: 30px;
          margin-right: 20px;
        }
      }
      .uppy-Dashboard-Item-name {
        font-size: 14px;
        font-weight: 600;
      }
      .uppy-Dashboard-Item-status {
        font-size: 12px;
      }
      .uppy-Dashboard-Item-actionWrapper {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .uppy-Dashboard-Item-action {
          width: 100%;
          justify-content: flex-start;
          display: flex;
          color: ${colors.darkPurple};
          font-family: LinearSans;
          font-size: 14px;
          letter-spacing: 0;
          line-height: 18px;
          &--edit {
            svg {
              display: none;
            }
            &:before {
              ${IconSharedStyles}
              background-image: url(${EditIcon});
              width: 20px;
              height: 20px;
            }
            &:after {
              content: "Edit";
            }
          }
          &--remove {
            position: inherit;
            svg {
              display: none;
            }
            &:before {
              ${IconSharedStyles}
              background-image: url(${TrashIcon});
              width: 20px;
              height: 20px;
            }
            &:after {
              content: "Delete";
            }
          }
        }
      }
    }
  }
  .uppy-DashboardContent-panelBody {
    background-color: ${colors.cream};
    border: 1px solid ${colors.secondaryBlack};
  }
  .uppy-Dashboard-FileCard {
    .uppy-Dashboard-FileCard-info {
      height: unset;
      padding: 10px 0px;
    }
  }
`;

const StyledUploadIcon = styled.i`
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  height: 54px;
  width: 59px;
  z-index: 1;
  position: absolute;
  position: absolute;
  left: 50%;
  transform: translate(-50%, 60%);
`;

const metaFields = [
  { id: "name", name: "Name", placeholder: "File name" },
  { id: "description", name: "Description", placeholder: "File Description" },
];
const note =
  "All CSV files must have either latitude & longitude, cities & countries or full addresses.";

// 1GB
const maxFileSize = 1 * 1024 * 1024 * 1024;

const UploadFiles = ({
  onUploadFinish,
  onUploadError,
  setUppyRef,
  geodataType = "latLon",
  onFileAdded,
  onFileRemoved,
  process = false,
}: Props) => {
  const [showUploadIcon, setShowUploadIcon] = useState(true);
  const [uppyInitialized, setUppyInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const uppy = useRef<Uppy>();

  const { getAccessTokenSilently, loginWithRedirect } = useAuth0();
  const uploadFinish = useCallback(
    (uploadResponse: UploadResponse) => {
      onUploadFinish(uploadResponse);
    },
    [onUploadFinish],
  );
  const { createPartnerDataset, startUploadProcess } = useUploadProcess({
    onUploadFinish: uploadFinish,
    geodataType,
    process,
  });

  const onUploadSuccess = useCallback(
    async (file?: UppyFile<Meta, Record<string, never>>, response?: any) => {
      if (!file) {
        return;
      }
      // Extract name and description from file meta
      const { name, description }: { name?: string; description?: string } = file.meta ?? {};

      const datasetName = (name ?? file.name ?? "").trim();
      const datasetDescription = (description ?? "").trim();

      const partnerDataset = await createPartnerDataset({
        variables: {
          name: datasetName,
          description: datasetDescription,
        },
      });
      if (partnerDataset.data && response?.uploadURL) {
        startUploadProcess(
          response.uploadURL,
          partnerDataset.data.createPartnerDataset.pfPartnerDataset.id,
          process,
        );
      }
    },
    [createPartnerDataset, startUploadProcess, process],
  );

  useEffect(() => {
    return () => {
      uppy.current?.destroy();
    };
  }, []);

  useEffect(() => {
    async function initUppy() {
      const uppyOptions: UppyOptions<Record<string, unknown>, any> = {
        id: "uppy",
        restrictions: {
          allowedFileTypes: [".csv", ".json", ".geojson"],
          maxFileSize,
          minFileSize: null,
          maxTotalFileSize: null,
          maxNumberOfFiles: null,
          minNumberOfFiles: null,
          requiredMetaFields: [],
        },
        autoProceed: false,
        allowMultipleUploadBatches: false,
        debug: !env.isProd,
      };
      const companionUrl = `${env.PF_API}/upload`;
      let token = "";
      try {
        token = await getAccessTokenSilently();
      } catch (e: any) {
        if (e.error === "login_required" || e.error === "consent_required") {
          loginWithRedirect();
        }
        throw e;
      }

      if (!uppy.current) {
        uppy.current = new Uppy(uppyOptions).use(AwsS3, {
          id: "pf-uppy-s3-multipart",
          limit: 4,
          shouldUseMultipart: true,
          endpoint: companionUrl,
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
      }
      if (setUppyRef) {
        setUppyRef(uppy.current);
      }
      setUppyInitialized(true);
    }
    initUppy();
  }, [getAccessTokenSilently, loginWithRedirect, uppy, onUploadSuccess, setUppyRef]);

  useEffect(() => {
    if (uppyInitialized) {
      uppy.current?.on("upload-success", onUploadSuccess);
    }
    return () => {
      uppy.current?.off("upload-success", onUploadSuccess);
    };
  }, [onUploadSuccess, uppyInitialized]);

  useEffect(() => {
    const uppyInstance = uppy.current;
    if (!uppyInitialized || !uppyInstance) return;

    const handleEditStart = () => setIsEditing(true);
    const handleEditEnd = () => setIsEditing(false);

    uppyInstance.on("dashboard:file-edit-start", handleEditStart);
    uppyInstance.on("dashboard:file-edit-complete", handleEditEnd);

    return () => {
      uppyInstance.off("dashboard:file-edit-start", handleEditStart);
      uppyInstance.off("dashboard:file-edit-complete", handleEditEnd);
    };
  }, [uppyInitialized]);

  if (!uppy.current || !uppyInitialized) {
    return null;
  }

  uppy.current.on("error", (error) => {
    setErrorMessage(error.message);
    if (onUploadError) {
      onUploadError();
    }
  });

  uppy.current.on("upload-error", (error) => {
    console.error(error);
    if (onUploadError) {
      onUploadError();
    }
  });

  uppy.current.on("file-added", (file) => {
    const filesCount = uppy.current?.getFiles().length;
    setShowUploadIcon(filesCount === 0); // hide icon and text when new files are added
    setErrorMessage("");
    if (onFileAdded) {
      onFileAdded(file);
    }
  });

  uppy.current.on("file-removed", (file) => {
    const filesCount = uppy.current?.getFiles().length;
    setShowUploadIcon(filesCount === 0); // hide icon and text when new files are added
    setErrorMessage("");
    if (onFileRemoved) {
      onFileRemoved(file);
    }
  });

  return (
    <Container isEditing={isEditing}>
      <div className="uppy-dashboard">
        {showUploadIcon && <StyledUploadIcon icon={UploadIcon} />}
        <Dashboard
          height={270}
          uppy={uppy.current}
          hideProgressDetails={false}
          note={note}
          proudlyDisplayPoweredByUppy={false}
          metaFields={metaFields}
          hideUploadButton
        />
      </div>
      {errorMessage && <ErrorMessage text={errorMessage} />}
    </Container>
  );
};

export default UploadFiles;
