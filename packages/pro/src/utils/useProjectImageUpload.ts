import { useCallback, useEffect, useRef, useState } from "react";
// @ts-ignore
import { startExportingImage, cleanupExportImage, setExportImageSetting } from "kepler.gl/actions";
// @ts-ignore
import { dataURItoBlob } from "kepler.gl";
import Uppy, { UppyFile, UppyOptions, SuccessResponse } from "@uppy/core";
import { useAuth0 } from "@auth0/auth0-react";
import AwsS3Multipart from "@uppy/aws-s3-multipart";

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
          mapW: 1400,
          mapH: 990,
          legend: true,
        }),
      );
      dispatch(startExportingImage());
      setExportingImage(true);
    };
    setTimeout(() => {
      startExporting();
    }, 5000);
  }, [dispatch, setExportingImage]);

  const imageDataUri = keplerGl[MAP_ID]?.uiState?.exportImage?.imageDataUri;
  useEffect(() => {
    if (imageDataUri && projectId && exportingImage) {
      async function initUppy() {
        const uppyOptions: UppyOptions = {
          id: "uppy-image-upload",
          autoProceed: false,
          allowMultipleUploads: false,
        };
        const companionUrl = `${env.PF_API}/upload`;
        let token = "";
        try {
          token = await getAccessTokenSilently();
        } catch (e) {
          throw e;
        }
        const AuthHeader = {
          companionHeaders: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        };

        if (!uppy.current) {
          uppy.current = new Uppy(uppyOptions).use(AwsS3Multipart, {
            id: "pf-uppy-s3-multipart",
            companionUrl,
            ...AuthHeader,
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
        setExportingImage(false);
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
      uppy.current?.close();
    };
  }, []);

  const onUploadSuccess = useCallback(
    async (_file: UppyFile | undefined, response: SuccessResponse) => {
      if (response.uploadURL) {
        updateProject({ imageUrl: response.uploadURL });
      }
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

  return { exportImage };
};

export default useProjectImageUpload;
