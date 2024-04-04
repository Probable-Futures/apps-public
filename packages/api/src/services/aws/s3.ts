import * as stream from "stream";
import AWS from "aws-sdk";
import { logger } from "../../utils/logger";

export const readObjectStream = (
  params: AWS.S3.Types.GetObjectRequest,
  s3: AWS.S3 = new AWS.S3(),
): stream.Readable => s3.getObject(params).createReadStream();

export const writeObjectStream = (
  params: AWS.S3.Types.PutObjectRequest,
  options?: AWS.S3.ManagedUpload.ManagedUploadOptions,
  s3: AWS.S3 = new AWS.S3(),
): {
  writeStream: stream.Writable;
  uploadManager: AWS.S3.ManagedUpload;
} => {
  const passThroughStream = new stream.PassThrough();
  params.Body = passThroughStream;

  const uploadManager = s3.upload(params, options, (error, _data) => {
    logger.error("Error streaming upload to s3", { s3Params: params, error });
  });

  return {
    uploadManager,
    writeStream: passThroughStream,
  };
};

export const uploadObject = (
  params: AWS.S3.Types.PutObjectRequest,
  options?: AWS.S3.ManagedUpload.ManagedUploadOptions,
  s3: AWS.S3 = new AWS.S3(),
): Promise<AWS.S3.ManagedUpload.SendData> =>
  new Promise((resolve, reject) => {
    s3.upload(params, options, async (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(data);
    });
  });

export const deleteObject = (
  params: AWS.S3.Types.DeleteObjectRequest,
  s3: AWS.S3 = new AWS.S3(),
): Promise<AWS.S3.DeleteObjectOutput> =>
  new Promise((resolve, reject) => {
    s3.deleteObject(params, async (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(data);
    });
  });

type SignedUrlParams<T> = T & {
  Expires?: number;
};

export function getSignedUrl<T>(
  operation: string,
  params: SignedUrlParams<T>,
  s3: AWS.S3 = new AWS.S3(),
): Promise<string> {
  return s3.getSignedUrlPromise(operation, params);
}

export const getObjectSignedUrl = async (
  params: SignedUrlParams<AWS.S3.Types.GetObjectRequest>,
  s3: AWS.S3 = new AWS.S3(),
): Promise<string> => await getSignedUrl("getObject", params, s3);
