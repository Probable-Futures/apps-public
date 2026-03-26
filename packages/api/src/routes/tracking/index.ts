import express from "express";
import { submitToAirtable } from "../../services/tracking/request";
import { env } from "../../utils";
import { validateFormData, ImpactTrackingFormData } from "./parameters";
import { error as errorUtils, slackUtils } from "../../utils";
import { sendSlackNotification } from "../../services/slack-notfier";
import { isProd } from "../../utils/env";

const router = express.Router();

const errorPrefix = "Impact Tracking Error";

const SLACK_CHANNEL = "#perspectives-feedback";
const SLACK_WEBHOOK_SSM_PARAM = "slack-perspectives-feedback-webhook-url";

function buildSlackMessage(data: ImpactTrackingFormData): string {
  const status = data.helpful ? ":large_green_circle: Helpful" : ":red_circle: Not Helpful";
  const lines = [
    `*New Perspectives Feedback*`,
    `*Status:* ${status}`,
    `*Article:* <${data.articleLink}|${data.articleName}>`,
  ];

  if (data.perspectiveCategory) {
    lines.push(`*Category:* ${data.perspectiveCategory}`);
  }

  if (data.email) {
    lines.push(`*Email:* ${data.email}`);
  }

  if (data.whatWasHelpful) {
    lines.push(`*What was helpful:* ${data.whatWasHelpful}`);
  }

  if (data.howToImprove) {
    lines.push(`*How to improve:* ${data.howToImprove}`);
  }

  return lines.join("\n");
}

router.post("/perspectives", async (req, res) => {
  try {
    const apiKey = req.query.apiKey as string | undefined;

    if (apiKey !== env.API_KEY_FOR_IMPACT_TRACKING_ENDPOINT) {
      res.status(401).send({ error: "Unauthorized access." });
      return;
    }

    const formData = await validateFormData(req.body);

    if (isProd) {
      try {
        await sendSlackNotification(
          buildSlackMessage(formData),
          SLACK_CHANNEL,
          SLACK_WEBHOOK_SSM_PARAM,
        );
      } catch (e) {
        console.error("Failed to send Slack notification:", e);
      }
    }

    const request = await submitToAirtable(formData);

    if (request.ok) {
      res
        .status(200)
        .send({ success: true, message: "Impact tracking data submitted successfully." });
    } else {
      const errorData = await request.json();
      console.error(errorData);
      const relevantData = formData.email ? `Email: ${formData.email}` : "";
      await slackUtils.sendErrorToSlack(JSON.stringify(errorData), errorPrefix, relevantData);
      res.status(request.status).send({ error: errorData });
    }
  } catch (error: any) {
    const status = "status" in error && typeof error.status === "number" ? error.status : 500;
    const serializedError = errorUtils.serialize(error);
    console.error(error);
    res.status(status).send(serializedError);
  }
});

export default router;
