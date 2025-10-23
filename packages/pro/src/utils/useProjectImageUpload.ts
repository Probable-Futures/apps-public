import { useCallback, useEffect, useRef, useState } from "react";
import { startExportingImage, cleanupExportImage, setExportImageSetting } from "@kepler.gl/actions";
import { dataURItoBlob } from "@kepler.gl/utils";
import Uppy, { Meta, UppyFile, UppyOptions } from "@uppy/core";
import { useAuth0 } from "@auth0/auth0-react";
import AwsS3 from "@uppy/aws-s3";

import { MAP_ID } from "../consts/MapConsts";
import useProjectUpdate from "./useProjectUpdate";
import * as env from "../consts/env";
import { useAppDispatch, useAppSelector } from "../app/hooks";

const useProjectImageUpload = () => {
  const { updateProject } = useProjectUpdate();
  const dispatch = useAppDispatch();
  const projectId = useAppSelector((state) => state.project.projectId);
  const keplerGl = useAppSelector((state) => state.keplerGl);

  const { getAccessTokenSilently } = useAuth0();
  const uppy = useRef<Uppy>();
  const [uppyInitialized, setUppyInitialized] = useState(false);
  const [exportingImage, setExportingImage] = useState(false);

  const exportImage = useCallback(() => {
    const startExporting = () => {
      dispatch(
        setExportImageSetting({
          ratio: "SCREEN",
          resolution: "ONE_X",
          mapW: 1170,
          mapH: 800,
          legend: true,
        }),
      );
      dispatch(startExportingImage());
      setExportingImage(true);
    };
    setTimeout(() => {
      startExporting();
    }, 10000);
  }, [dispatch, setExportingImage]);

  const imageDataUri = keplerGl[MAP_ID]?.uiState?.exportImage?.imageDataUri;
  useEffect(() => {
    if (imageDataUri && projectId && exportingImage) {
      async function initUppy() {
        const uppyOptions: UppyOptions<Record<string, unknown>, any> = {
          id: "uppy-image-upload",
          autoProceed: false,
          allowMultipleUploads: false,
          restrictions: {
            maxFileSize: null,
            minFileSize: null,
            maxTotalFileSize: null,
            maxNumberOfFiles: null,
            minNumberOfFiles: null,
            allowedFileTypes: null,
            requiredMetaFields: [],
          },
        };
        const companionUrl = `${env.PF_API}/upload`;
        let token = "";
        try {
          token = await getAccessTokenSilently();
        } catch (e) {
          throw e;
        }

        if (!uppy.current) {
          uppy.current = new Uppy(uppyOptions).use(AwsS3, {
            id: "pf-uppy-s3-multipart",
            endpoint: companionUrl,
            limit: 4,
            shouldUseMultipart: true,
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
        }
        if (uppy.current) {
          const file = dataURItoBlob(imageDataUri);
          uppy.current.addFile({ data: file, name: projectId, type: "image/png" });
          uppy.current.setMeta({ source: "project-image-upload" });
          uppy.current.upload();
          dispatch(cleanupExportImage());
        }
        setUppyInitialized(true);
      }
      if (!uppy.current) {
        initUppy();
      }
    }
  }, [
    imageDataUri,
    dispatch,
    projectId,
    updateProject,
    getAccessTokenSilently,
    setExportingImage,
    exportingImage,
  ]);

  useEffect(() => {
    return () => {
      uppy.current?.destroy();
    };
  }, []);

  const onUploadSuccess = useCallback(
    async (_file: UppyFile<Meta, Record<string, never>> | undefined, response: any) => {
      if (response.uploadURL) {
        await updateProject({ imageUrl: response.uploadURL });
      }
      setTimeout(() => {
        setExportingImage(false);
      });
    },
    [updateProject],
  );

  useEffect(() => {
    if (uppyInitialized) {
      uppy.current?.on("upload-success", onUploadSuccess);
    }
    return () => {
      uppy.current?.off("upload-success", onUploadSuccess);
    };
  }, [onUploadSuccess, uppyInitialized]);

  uppy.current?.on("error", (error) => {
    dispatch(cleanupExportImage());
  });

  return { exportImage, exportingImage };
};

export default useProjectImageUpload;
