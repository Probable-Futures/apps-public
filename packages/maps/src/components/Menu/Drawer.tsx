import { PropsWithChildren } from "react";
import styled from "styled-components";

import { colors } from "../../consts";
import { ReactComponent as CaretRightIcon } from "../../assets/icons/sidebar-caret-right.svg";

type SidebarProps = {
  sidebarOpen: boolean;
};

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  width: 256px;
  bottom: 0;
  background: ${colors.white};
  transition: transform 0.7s ease;
  transform: ${({ sidebarOpen }: SidebarProps) =>
    sidebarOpen ? "translateX(0)" : "translateX(calc(-100% + 52px))"};
`;

const SidebarButton = styled.button`
  position: absolute;
  cursor: pointer;
  top: 0;
  right: 0;
  width: 52px;
  height: 100%;
  background-color: transparent;
  border: none;
  display: ${({ sidebarOpen }: SidebarProps) => (sidebarOpen ? "none" : "flex")};
  align-items: center;
  justify-content: center;
  padding: 0;

  svg {
    width: 16px;
    height: auto;
  }
`;

type DrawerProps = PropsWithChildren<{
  open: boolean;
  showSidebar: () => void;
  hideSidebar: () => void;
}>;

export default function Drawer({ open, showSidebar, children }: DrawerProps): JSX.Element {
  return (
    <Sidebar sidebarOpen={open}>
      {children}
      <SidebarButton sidebarOpen={open} onClick={showSidebar}>
        <CaretRightIcon />
      </SidebarButton>
    </Sidebar>
  );
}
