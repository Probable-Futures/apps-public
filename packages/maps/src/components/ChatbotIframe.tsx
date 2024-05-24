import React, { useState } from "react";
import styled from "styled-components";

import ChatbotIcon from "../assets/icons/chatbot.png";
import { sendDataToChatbot } from "../utils/chatbot";

const StyledButton = styled.button`
  border: none;
  background-color: transparent;
  border-radius: 50%;
  cursor: pointer;
  position: absolute;
  top: 20px;
  right: 20px;
`;

const StyledIframe = styled.iframe`
  width: 480px;
  height: 570px;
  border: none;
`;

const ChatbotIframe = ({ selectedData, degrees }: { selectedData: any; degrees: any }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const chatbotUrl = process.env.CHATBOT_APP_URL;

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
        <>
          <StyledButton onClick={toggleChat}>
            <span aria-hidden="true">x</span>
          </StyledButton>

          <StyledIframe id="chatbot-id" src={chatbotUrl} title="Chatbot" onLoad={onIframeLoad} />
        </>
      )}
    </div>
  );
};

export default ChatbotIframe;
