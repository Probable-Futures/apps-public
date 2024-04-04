import { PartnerDatasetUploadNode } from "../components/File/UploadFiles";
import { UploadProcessErrorsUI } from "../shared/types";

export type CreatePartnerDatasetUploadResponse = {
  createPartnerDatasetUpload: {
    pfPartnerDatasetUpload: PartnerDatasetUploadNode;
  };
};

export type PartnerDatasetUpload = {
  viewPartnerDatasetUpload: PartnerDatasetUploadNode;
};

export const readUploadErrors = (datasetUploadNode: PartnerDatasetUploadNode) => {
  const errors: UploadProcessErrorsUI[] = [];
  const { processingErrors, processingWithCoordinatesErrors } = datasetUploadNode;
  if (processingErrors?.errors.length) {
    errors.push({
      message: "Failed to parse the file.",
      logErrors: processingErrors.errors,
    });
  }
  if (processingErrors?.invalid_rows.length) {
    errors.push({
      message: "Failed to validate the file.",
      descriptiveErrors: processingErrors.invalid_rows,
    });
  }
  if (processingWithCoordinatesErrors?.errors.length) {
    errors.push({
      message: "Failed while adding the nearby PF coordinates to the dataset",
      logErrors: processingWithCoordinatesErrors.errors,
    });
  }
  return errors;
};
