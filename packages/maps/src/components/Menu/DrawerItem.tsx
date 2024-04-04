import { useState, PropsWithChildren } from "react";
import styled, { css } from "styled-components";

import useNetworkStatus from "../../contexts/useNetworkStatus";
import { colors } from "../../consts";
import CaretDownIcon from "../../assets/icons/caret-down.svg";
import CaretRightIcon from "../../assets/icons/caret-right.svg";
import SidebarCaretRightIcon from "../../assets/icons/sidebar-caret-right.svg";
import LoadingIcon from "../../assets/icons/loading.svg";

type ItemProps = {
  sidebarOpen: boolean;
  expand: boolean;
};

const ExpandedItemStyles = css`
  background-image: url(${CaretDownIcon});
`;

const SidebarOpenStyles = css`
  transition: color 0.5s 0.3s ease;
  background-image: url(${CaretRightIcon});
  color: ${colors.darkPurple};

  &:hover {
    background-color: ${colors.whiteSmoke};
  }
`;

const Item = styled.button`
  cursor: pointer;
  width: 100%;
  padding: 16px 0;
  box-sizing: border-box;
  margin: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;
  color: transparent;
  background-color: transparent;
  background-position: calc(100% - 16px) center;
  background-repeat: no-repeat;
  background-size: 16px auto;
  border: none;
  transition: background-color 0.2s ease;
  ${({ sidebarOpen }: ItemProps) => sidebarOpen && SidebarOpenStyles};
  ${({ expand, sidebarOpen }: ItemProps) => (expand && sidebarOpen ? ExpandedItemStyles : null)};
`;

const Title = styled.h2`
  color: ${colors.darkPurple};
  font-size: 14px;
  letter-spacing: 0;
  line-height: 16px;
  margin: 0;
`;

type IconProps = {
  icon: string;
  sidebarOpen: boolean;
};

const Icon = styled.i`
  background-color: transparent;
  background-image: url(${({ icon }: IconProps) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 20px;
  height: 20px;
  display: inline-block;
  margin: 0 16px;
  transition: transform 0.7s ease;
  transform: ${({ sidebarOpen }: IconProps) =>
    sidebarOpen ? "translateX(0);" : "translateX(204px);"};
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
      <Item sidebarOpen={open} expand={expand} onClick={toggle}>
        <Icon sidebarOpen={open} icon={icon}></Icon>
        <Title>{title}</Title>
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
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0;
  height: 52px;
  padding: 16px 0;
  box-sizing: border-box;
  margin: 0;
  display: flex;
  align-items: center;
  transition: ${({ sidebarOpen }: HeaderProps) =>
    sidebarOpen ? "color 0.5s 0.3s ease" : "color 0.2s ease"};
  color: ${({ sidebarOpen }: HeaderProps) => (sidebarOpen ? "inherit" : "transparent")};
  border-bottom: 1px solid ${colors.lightGrey};
`;

const SidebarButton = styled.button`
  position: absolute;
  cursor: pointer;
  top: 0;
  right: 0;
  width: 52px;
  height: 52px;
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
      {title}
      {showLoader && isLoading && <Loader sidebarOpen={open} icon={LoadingIcon}></Loader>}
      <SidebarButton sidebarOpen={open} onClick={onClick} />
    </Header>
  );
}
