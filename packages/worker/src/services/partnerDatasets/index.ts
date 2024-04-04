import { env } from "../../utils";
import * as s3 from "../aws/s3";
export * from "./process";
export * from "./enrich";
export * from "./nearbyCoordinates";

const PARTNER_DATASET_BUCKET = env.AWS_S3_BUCKET;

export const deleteUploadS3Object = async (file: string) => {
  await s3.deleteObject({
    Bucket: PARTNER_DATASET_BUCKET,
    Key: file,
  });
};

export const deleteUploadS3Objects = async (files: string[]) => {
  await s3.deleteObjects({
    Bucket: PARTNER_DATASET_BUCKET,
    Delete: { Objects: files.map((file) => ({ Key: file })) },
  });
};
