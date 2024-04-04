import https from "https";
import AWS from "aws-sdk";
import URL from "url";

import { AWS_S3_REGION } from "../utils/env";
import { credentials } from "../services/aws";

const SSM = new AWS.SSM({
  credentials: credentials,
  region: AWS_S3_REGION,
});

const request = async (url: string, data: any) => {
  return new Promise((resolve, reject) => {
    const parsedUrl = URL.parse(url);
    const options = {
      host: parsedUrl.host,
      path: parsedUrl.path,
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    const req = https.request(options);
    req.write(data);
    req.end(null, () => {
      /* Request has been fully sent */
      resolve(req);
    });
  });
};

export const sendSlackNotification = async (
  message: string,
  channel: string = "#pf-engineering-production-notifications",
) => {
  try {
    const slackWebhookUrl = await SSM.getParameter({
      Name: "slack-webhook-url",
      WithDecryption: true,
    }).promise();

    const body = {
      channel,
      text: message,
    };
    if (slackWebhookUrl.Parameter && slackWebhookUrl.Parameter.Value) {
      await request(slackWebhookUrl.Parameter.Value, JSON.stringify(body));
    } else {
      throw new Error("Slack Webhook Url was not provided");
    }
  } catch (e) {
    throw e;
  }
};
