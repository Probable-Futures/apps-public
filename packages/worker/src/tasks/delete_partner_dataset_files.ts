import { Task } from "graphile-worker";
import { URL } from "url";

import { extendDebugger } from "../utils/debugger";
import { deleteUploadS3Objects } from "../services/partnerDatasets";
import * as types from "../types";

const debug = extendDebugger("tasks:delete_partner_dataset_files");
const deletePartnerDatasetFiles: Task = async (payload, { logger }) => {
  debug("start task: %o", payload);
  const { files } = payload as types.DeletePartnerDatasetPayload;

  try {
    await deleteUploadS3Objects(files.map((file) => new URL(file).pathname.substring(1)));
  } catch (e: any) {
    logger.error("Failed to delete partner_dataset_files", e);
    throw e;
  }
};

export default deletePartnerDatasetFiles;
