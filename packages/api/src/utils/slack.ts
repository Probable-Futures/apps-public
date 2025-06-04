import { sendSlackNotification } from "../services/slack-notfier";

export const sendErrorToSlack = async (error: string, prefix: string, relevantData?: string) => {
  const includeRelevantData = relevantData ? `\`Relevant Data:\` ${relevantData}` : "";
  const message = `:red_circle: ${prefix}:
  \`\`\`${error}\`\`\`\n
  ${includeRelevantData}\n
  \`Source:\` "PF API"
  `;
  try {
    sendSlackNotification(message);
  } catch (e) {
    console.error(e);
  }
};
