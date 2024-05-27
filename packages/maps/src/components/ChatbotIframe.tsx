import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";

import ChatbotIcon from "../assets/icons/chatbot.svg";
import { sendDataToChatbot } from "../utils/chatbot";

type IFrameProps = { selectedData?: types.Map; degrees?: number };

const StyledButton = styled.button`
  border: none;
  background-color: transparent;
  border-radius: 50%;
  cursor: pointer;
  position: absolute;
  top: 15px;
  right: 25px;
`;

const StyledChatButton = styled.button`
  border: none;
  background-color: transparent;
  border-radius: 50%;
  cursor: pointer;
`;

const StyledIframe = styled.iframe`
  width: 480px;
  height: 570px;
  border: none;
`;

const ChatIcon = styled.img`
  width: 54px;
  height: 54px;
`;

const chatbotUrl = process.env.REACT_APP_CHATBOT_URL;

const ChatbotIframe = ({ selectedData, degrees }: IFrameProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const onIframeLoad = useCallback(() => {
    setTimeout(() => {
      sendDataToChatbot({ dataset: selectedData, warmingScenario: degrees, action: "fetchData" });
    }, 3000);
  }, [degrees, selectedData]);

  return (
    <div>
      <StyledChatButton onClick={toggleChat}>
        {!isChatOpen && <ChatIcon src={ChatbotIcon} alt="Chatbot icon" />}
      </StyledChatButton>

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
