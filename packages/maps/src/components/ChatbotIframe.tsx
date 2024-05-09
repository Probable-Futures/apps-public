import React, { useState } from "react";
import ChatbotIcon from "../assets/icons/chatbot.png";

const ChatbotIframe = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  const chatbotUrl = "http://localhost:3000";

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
          }}
        >
          <span aria-hidden="true">X</span>
        </button>
      )}

      {isChatOpen && (
        <iframe
          src={chatbotUrl}
          title="Chatbot"
          width="100%"
          height="600px"
          style={{ border: "none" }}
        />
      )}
    </div>
  );
};

export default ChatbotIframe;
