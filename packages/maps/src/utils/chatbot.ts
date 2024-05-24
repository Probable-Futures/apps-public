export const sendDataToChatbot = (data: any) => {
  const iframe = document.getElementById("chatbot-id") as HTMLIFrameElement;
  if (iframe) {
    iframe?.contentWindow?.postMessage(data, "*");
  }
};
