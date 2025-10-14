import { URL } from "url";
import * as companion from "@uppy/companion";
import { v4 as uuid } from "uuid";
import { Express } from "express";
import { Server } from "http";

import {
  isDev,
  isLocal,
  isProd,
  ROOT_URL,
  AWS_KEY,
  AWS_SECRET,
  AWS_S3_UPLOADS_BUCKET,
  AWS_S3_REGION,
  UPPY_COMPANION_SECRET_KEY,
  UPPY_COMPANION_GOOGLE_DRIVE_KEY,
  UPPY_COMPANION_GOOGLE_DRIVE_SECRET,
} from "../utils/env";
import { apiRoutes } from "../utils/constants";
import { sendSlackNotification } from "../services/slack-notfier";

const rootUrl = new URL(ROOT_URL);
const host = rootUrl.host;
const protocol = rootUrl.protocol.replace(":", "");

// 1GB
const maxFileSize = 1 * 1024 * 1024 * 1024;

function getKey({
  req: _req,
  filename,
  metadata,
}: {
  req: Express.Request;
  filename: string;
  metadata: any;
}): string {
  const uploadDir = isLocal && isDev ? "local-development" : "";
  if (metadata && metadata.source === "project-image-upload") {
    return `${uploadDir}/images/${filename}.png`;
  } else {
    const randomId = uuid();
    return `${uploadDir}uploads/${randomId}-${filename}`;
  }
}

const options = {
  providerOptions: {
    drive: {
      key: UPPY_COMPANION_GOOGLE_DRIVE_KEY,
      secret: UPPY_COMPANION_GOOGLE_DRIVE_SECRET,
    },
  },
  s3: {
    getKey,
    key: AWS_KEY,
    secret: AWS_SECRET,
    bucket: AWS_S3_UPLOADS_BUCKET,
    region: AWS_S3_REGION,
    acl: "private",
  },
  server: {
    host,
    protocol,
    path: apiRoutes.upload,
  },
  filePath: "/tmp",
  secret: UPPY_COMPANION_SECRET_KEY,
  debug: !isProd,
  uploadUrls: [
    "https://local.probablefutures.org",
    "https://dev-pro.probablefutures.org",
    "https://pro.probablefutures.org",
    "https://probablefutures.org",
  ],
  maxFileSize,
  corsOrigins: false,
};

export default (app: Express, httpServer: Server) => {
  const companionApp = companion.app(options);

  app.use(apiRoutes.upload, companionApp.app);
  companion.socket(httpServer);

  const { emitter } = companionApp;
  emitter.on("upload-start", ({ token }: any) => {
    function onUploadEvent({ action, payload }: any) {
      if (action === "success") {
        emitter.off(token, onUploadEvent); // avoid listener leak
      } else if (action === "error") {
        emitter.off(token, onUploadEvent); // avoid listener leak
        console.error("Upload failed", payload);
        sendSlackNotification(`File upload failed: ${payload?.toString()}}`);
      }
    }
    emitter.on(token, onUploadEvent);
  });
};
