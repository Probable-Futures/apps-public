import { useState, PropsWithChildren } from "react";
import styled from "styled-components";

import { ReactComponent as CaretUp } from "../../assets/icons/caret-up.svg";
import { ReactComponent as CaretDown } from "../../assets/icons/caret-down.svg";

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
  cursor: pointer;
  margin: 0 20px 12px 52px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CaretIcon = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }
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
      <Header onClick={() => setIsOpen(!isOpen)}>
        <CaretIcon>{isOpen ? <CaretUp /> : <CaretDown />}</CaretIcon>
        {header}
      </Header>
      <Content isOpen={isOpen}>{children}</Content>
    </>
  );
}
