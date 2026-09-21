import { sendSlackNotification } from "../services/slack-notfier";
import { logger } from "./logger";

/**
 * Delivery is fire-and-forget and must never reject: the transport reaches out to
 * SSM and Slack, and an unhandled rejection terminates the process on Node >= 15.
 */
export const notifySlack = (
  message: string,
  channel?: string,
  ssmWebhookParamName?: string,
): Promise<void> =>
  sendSlackNotification(message, channel, ssmWebhookParamName).catch((e) => {
    try {
      logger.error({ err: e, channel }, "Failed to send Slack notification");
    } catch {
      // A throwing logger would otherwise reject the promise this function guarantees.
    }
  });

export const sendErrorToSlack = async (error: string, prefix: string, relevantData?: string) => {
  const includeRelevantData = relevantData ? `\`Relevant Data:\` ${relevantData}` : "";
  const message = `:red_circle: ${prefix}:
  \`\`\`${error}\`\`\`\n
  ${includeRelevantData}\n
  \`Source:\` "PF API"
  `;
  // Not awaited: callers await sendErrorToSlack on their error path, and awaiting
  // delivery here would block those responses on an SSM round trip.
  void notifySlack(message);
};
