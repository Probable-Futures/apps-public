import React, { useState } from "react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";

import ChatbotIcon from "../assets/icons/chatbot.png";
import { sendDataToChatbot } from "../utils/chatbot";

type IFrameProps = { selectedData?: types.Map; degrees?: number };

type ButtonProps = {
  position?: string;
  top?: string;
  right?: string;
};

const StyledButton = styled.button`
  ${({ position, top, right }: ButtonProps) => `
    border: none;
    background-color: transparent;
    border-radius: 50%;
    cursor: pointer;
    position: ${position};
    top: ${top};
    right: ${right};
  `}
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

const ChatbotIframe = ({ selectedData, degrees }: IFrameProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const chatbotUrl = process.env.REACT_APP_CHATBOT_URL;

  const onIframeLoad = () => {
    setTimeout(() => {
      sendDataToChatbot({ dataset: selectedData, warmingScenario: degrees, action: "fetchData" });
    }, 3000);
  };

  return (
    <div>
      <StyledButton onClick={toggleChat}>
        {!isChatOpen && <ChatIcon src={ChatbotIcon} alt="Chatbot icon" />}
      </StyledButton>

      {isChatOpen && (
        <>
          <StyledButton onClick={toggleChat} position="absolute" top="15px" right="30px">
            <span aria-hidden="true">x</span>
          </StyledButton>
          <StyledIframe id="chatbot-id" src={chatbotUrl} title="Chatbot" onLoad={onIframeLoad} />
        </>
      )}
    </div>
  );
};

export default ChatbotIframe;
