import React, { useState } from "react";
import ChatbotIcon from "../assets/icons/chatbot.png";
import { sendDataToChatbot } from "utils/chatbot";

const ChatbotIframe = ({ selectedData, degrees }: { selectedData: any; degrees: any }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const chatbotUrl = "http://localhost:3000";

  const onIframeLoad = () => {
    setTimeout(() => {
      sendDataToChatbot({ dataset: selectedData, warmingScenario: degrees, action: "fetchData" });
    }, 3000);
  };

  return (
    <div>
      <button
        onClick={toggleChat}
        style={{
          border: "none",
          backgroundColor: "transparent",
          borderRadius: "50%",
          cursor: "pointer",
        }}
      >
        {!isChatOpen && (
          <img src={ChatbotIcon} alt="Chatbot icon" style={{ width: "64px", height: "64px" }} />
        )}
      </button>

      {isChatOpen && (
        <button
          onClick={toggleChat}
          style={{
            border: "none",
            backgroundColor: "transparent",
            borderRadius: "50%",
            marginRight: "10px",
            cursor: "pointer",
            position: "absolute",
            top: "20px",
            right: "20px",
          }}
        >
          <span aria-hidden="true">x</span>
        </button>
      )}

      {isChatOpen && (
        <iframe
          id="chatbot-id"
          src={chatbotUrl}
          title="Chatbot"
          width="480px"
          height="570px"
          onLoad={onIframeLoad}
          style={{
            border: "none",
          }}
        />
      )}
    </div>
  );
};

export default ChatbotIframe;
