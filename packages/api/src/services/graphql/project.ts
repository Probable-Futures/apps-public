import AWS from "aws-sdk";
import { URL } from "url";

import { getObjectSignedUrl } from "../aws/s3";
import { AWS_KEY, AWS_SECRET, AWS_S3_UPLOADS_BUCKET } from "../../utils/env";
import { fileUtils, logger } from "../../utils";

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: AWS_KEY,
    secretAccessKey: AWS_SECRET,
  },
  signatureVersion: "v4",
});

type AnyArg = { [arg: string]: any };

type File = {
  name: string;
  url: string;
};

type ProjectDataset = {
  upload_id: string;
  partner_dataset_id: string;
  enrich: boolean;
  pf_dataset_id: number;
  processed_with_coordinates_file: string;
  original_file: string;
  enriched_dataset_file: string;
  name: string;
};

type ProjectShareResponse = {
  pf_dataset_id: number;
  map_config: Object;
  project_datasets: ProjectDataset[];
};

type ShareResponse = {
  mapConfig?: Object;
  files?: File[];
  pfDatasetId?: number;
};

const getSignedUrls = async (fileUrls: string[], type?: string) => {
  const response: string[] = [];
  for (let i = 0; i < fileUrls.length; i++) {
    const finalType = type
      ? type
      : fileUtils.getUrlExtension(fileUrls[i]) === "json"
      ? "json"
      : "text/csv";

    const objectUrl = await getObjectSignedUrl(
      {
        Bucket: AWS_S3_UPLOADS_BUCKET,
        Key: fileUrls[i],
        Expires: 15 * 60,
        ResponseContentType: finalType,
        ResponseContentDisposition: "attachment",
      },
      s3,
    );
    response.push(objectUrl);
  }

  return response;
};

export const datasetSignedUrls = async (_query: AnyArg, args: AnyArg) => {
  let response: string[] = [];
  try {
    response = await getSignedUrls(args.input.fileUrls, args.input.type);
  } catch (e: any) {
    logger.error("Error occured while signing urls.");
    logger.error(e);
  }
  return response;
};

export const projectSharedData = async (
  _query: AnyArg,
  args: AnyArg,
  context: AnyArg,
): Promise<ShareResponse> => {
  const slugId = args.slugId;

  let dbResponse,
    response: ShareResponse = {};
  try {
    dbResponse = await context.pgClient.query("select * from pf_public.project_share($1)", [
      slugId,
    ]);
  } catch (error) {
    console.error(error);
  }

  const files: File[] = [];
  const projectShareResponse = dbResponse.rows[0] as ProjectShareResponse;

  const projectDatasetsMap = projectShareResponse.project_datasets.reduce<
    Record<string, ProjectDataset>
  >((prev, curr) => {
    if (!prev[curr.partner_dataset_id]) {
      prev[curr.partner_dataset_id] = curr;
    } else if (curr.pf_dataset_id === projectShareResponse.pf_dataset_id) {
      prev[curr.partner_dataset_id] = curr;
    }
    return prev;
  }, {});

  Object.keys(projectDatasetsMap).forEach((datasetId) => {
    const projectDataset = projectDatasetsMap[datasetId];
    const url = projectDataset.enriched_dataset_file ?? projectDataset.original_file;
    if (url) {
      const rootUrl = new URL(url);
      files.push({
        name: projectDataset.name,
        url: decodeURIComponent(rootUrl.pathname).substring(1),
      });
    }
  });

  response.mapConfig = projectShareResponse.map_config;
  try {
    const signedUrls = await getSignedUrls(files.map(({ url }) => url));
    response.files = files.map((file, index) => ({ name: file.name, url: signedUrls[index] }));
    response.pfDatasetId = projectShareResponse.pf_dataset_id;
  } catch (e: any) {
    logger.error("Error occured while signing urls.");
    logger.error(e);
  }

  return response;
};
