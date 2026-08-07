import { useState, PropsWithChildren } from "react";
import styled, { css } from "styled-components";

import useNetworkStatus from "../../contexts/useNetworkStatus";
import { colors } from "../../consts";
import { ReactComponent as CaretRightIcon } from "../../assets/icons/caret-right.svg";
import SidebarCaretRightIcon from "../../assets/icons/sidebar-caret-right.svg";
import LoadingIcon from "../../assets/icons/loading.svg";
import { SIDEBAR_GUTTER, SIDEBAR_RAIL_WIDTH, SIDEBAR_WIDTH, dividerColor } from "./Menu.styled";

type ItemProps = {
  sidebarOpen: boolean;
  expand: boolean;
};

const SidebarOpenStyles = css`
  transition: color 0.5s 0.3s ease, background-color 0.2s ease;
  color: ${colors.darkPurple};

  &:hover {
    background-color: ${colors.whiteSmoke};
  }
`;

const Item = styled.button`
  cursor: pointer;
  width: 100%;
  padding: 14px 0;
  box-sizing: border-box;
  margin: 0;
  display: flex;
  align-items: center;
  text-align: left;
  color: transparent;
  background-color: ${({ expand, sidebarOpen }: ItemProps) =>
    expand && sidebarOpen ? colors.whiteSmoke : "transparent"};
  border: none;
  border-bottom: 1px solid ${dividerColor};
  transition: background-color 0.2s ease, color 0.2s ease;
  ${({ sidebarOpen }: ItemProps) => sidebarOpen && SidebarOpenStyles};
`;

const Title = styled.h2`
  flex: 1;
  color: ${colors.darkPurple};
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 16px;
  margin: 0;
`;

/**
 * An explicit rotating chevron rather than a swapped background image: it is the
 * only cue that a section opens, and it animates so the affordance reads.
 * Hidden with the labels when the sidebar is collapsed to its icon rail.
 */
const ExpandCaret = styled.i`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-right: ${SIDEBAR_GUTTER}px;
  color: ${colors.lightGrey2};
  opacity: ${({ sidebarOpen }: { sidebarOpen: boolean; expand: boolean }) => (sidebarOpen ? 1 : 0)};
  transition: opacity 0.2s ease, transform 0.25s ease;
  transform: ${({ expand }: { sidebarOpen: boolean; expand: boolean }) =>
    expand ? "rotate(90deg)" : "rotate(0)"};

  svg {
    width: 16px;
    height: 16px;
  }

  /* The asset ships a hardcoded dark fill; override it so the caret reads as chrome. */
  svg path {
    fill: currentColor;
  }
`;

type IconProps = {
  icon: string;
  sidebarOpen: boolean;
};

// Sized so its 20px box plus margins fills SIDEBAR_RAIL_WIDTH exactly, which is
// what lets the collapsed state shift it flush into the visible rail.
const Icon = styled.i`
  background-color: transparent;
  background-image: url(${({ icon }: IconProps) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 20px;
  height: 20px;
  flex: none;
  display: inline-block;
  margin: 0 ${(SIDEBAR_RAIL_WIDTH - 20) / 2}px;
  transition: transform 0.7s ease;
  transform: ${({ sidebarOpen }: IconProps) =>
    sidebarOpen ? "translateX(0);" : `translateX(${SIDEBAR_WIDTH - SIDEBAR_RAIL_WIDTH}px);`};
`;

const Loader = styled(Icon)`
  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  animation: rotating 2s linear infinite;
`;

const ExpandedItemContentStyles = css`
  max-height: 2950px;
  opacity: 1;
  overflow: initial;
`;

const ItemContent = styled.div`
  max-height: 0;
  transition: max-height 0.3s ease, padding 0.3s ease, opacity 0.3s ease;
  background-color: ${colors.whiteSmoke};
  overflow: hidden;
  opacity: 0;
  ${({ expand, sidebarOpen }: ItemProps) =>
    expand && sidebarOpen ? ExpandedItemContentStyles : null};
`;

export default function DrawerItem({
  open,
  icon,
  title,
  children,
}: PropsWithChildren<{ open: boolean; icon: string; title: string }>): JSX.Element {
  const [expand, setExpand] = useState(false);
  const toggle = () => {
    setExpand(!expand);
  };
  return (
    <>
      <Item
        sidebarOpen={open}
        expand={expand}
        onClick={toggle}
        aria-expanded={expand}
        type="button"
      >
        <Icon sidebarOpen={open} icon={icon}></Icon>
        <Title>{title}</Title>
        <ExpandCaret sidebarOpen={open} expand={expand} aria-hidden="true">
          <CaretRightIcon />
        </ExpandCaret>
      </Item>
      <ItemContent sidebarOpen={open} expand={expand}>
        {children}
      </ItemContent>
    </>
  );
}

type HeaderProps = {
  sidebarOpen: boolean;
};

const Header = styled.h1`
  width: 100%;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
  height: ${SIDEBAR_RAIL_WIDTH}px;
  box-sizing: border-box;
  margin: 0;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: ${({ sidebarOpen }: HeaderProps) =>
    sidebarOpen ? "color 0.5s 0.3s ease" : "color 0.2s ease"};
  color: ${({ sidebarOpen }: HeaderProps) => (sidebarOpen ? "inherit" : "transparent")};
  border-bottom: 1px solid ${dividerColor};
`;

// Icon already reserves the rail width; this extra inset is deliberate, to give
// the app title more breathing room than the section rows below it.
const HeaderTitle = styled.span`
  flex: 1;
  padding-left: 16px;
`;

const SidebarButton = styled.button`
  position: absolute;
  cursor: pointer;
  top: 0;
  right: 0;
  width: ${SIDEBAR_RAIL_WIDTH}px;
  height: ${SIDEBAR_RAIL_WIDTH}px;
  background-color: transparent;
  background-image: url(${SidebarCaretRightIcon});
  background-repeat: no-repeat;
  background-size: 16px auto;
  background-position: center;
  border: none;
  transform: rotate(180deg);
  display: ${({ sidebarOpen }: { sidebarOpen: boolean }) => (sidebarOpen ? "block" : "none")};
`;

export function HeaderItem({
  open,
  icon,
  title,
  onClick,
  showLoader,
}: PropsWithChildren<{
  open: boolean;
  icon: string;
  title: string;
  showLoader: boolean;
  onClick: () => void;
}>): JSX.Element {
  const { isLoading } = useNetworkStatus();

  return (
    <Header sidebarOpen={open} onClick={onClick}>
      <Icon sidebarOpen={open} icon={icon}></Icon>
      <HeaderTitle>{title}</HeaderTitle>
      {showLoader && isLoading && <Loader sidebarOpen={open} icon={LoadingIcon}></Loader>}
      <SidebarButton sidebarOpen={open} onClick={onClick} />
    </Header>
  );
}
