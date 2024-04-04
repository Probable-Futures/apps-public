import AWS from "aws-sdk";
import { AWS_KEY, AWS_SECRET, AWS_S3_REGION } from "../../utils/env";
import * as s3 from "./s3";

const credentials = new AWS.Credentials(AWS_KEY, AWS_SECRET);

// Fall back to credentials defined in env var
AWS.config.update({
  credentials: credentials, // credentials required for local execution
  region: AWS_S3_REGION,
});

export { s3, credentials };
