import { sendSlackNotification } from "../services/slack-notfier";

export const sendErrorToSlack = async (error: string, prefix: string) => {
  const message = `:red_circle: ${prefix}:
  \`\`\`${error}\`\`\`
  \`Source: "PF API"\`
  `;
  try {
    sendSlackNotification(message);
  } catch (e) {
    console.error(e);
  }
};
