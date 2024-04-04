import { useState, PropsWithChildren } from "react";
import styled from "styled-components";

import CaretUp from "../../assets/icons/caret-up.svg";
import CaretDown from "../../assets/icons/caret-down.svg";

type Status = {
  isOpen: boolean;
};

const Header = styled.button`
  border: none;
  background: none;
  text-align: left;
  padding-left: 25px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 16px;
  background-position: left center;
  background-repeat: no-repeat;
  background-size: 16px auto;
  cursor: pointer;
  margin: 0 20px 12px 52px;

  background-image: ${({ isOpen }: Status) => (isOpen ? `url(${CaretUp})` : `url(${CaretDown})`)};
`;

const Content = styled.div`
  overflow: hidden;
  opacity: ${({ isOpen }: Status) => (isOpen ? "1" : "0")};
  max-height: ${({ isOpen }: Status) => (isOpen ? "100vh" : "0")};
  transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
`;

export default function Collapsible({
  header,
  children,
}: PropsWithChildren<{ header: any }>): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Header isOpen={isOpen} onClick={() => setIsOpen(!isOpen)}>
        {header}
      </Header>
      <Content isOpen={isOpen}>{children}</Content>
    </>
  );
}
