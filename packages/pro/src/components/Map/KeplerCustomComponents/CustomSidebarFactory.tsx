import { CollapseButtonFactory, CollapseButtonProps, SidebarFactory } from "@kepler.gl/components";
import styled from "styled-components";
import { styles } from "@probable-futures/components-lib";

import OpenArrowIcon from "../../../assets/icons/map/icon-caret-right.svg";
import CloseArrowIcon from "../../../assets/icons/map/icon-caret-left.svg";
import { colors } from "../../../consts";

const StyledSideBarContainer = styled.div`
  .side-panel--container {
    transform-origin: top left;
    padding-top: 0;
    padding-right: 0;
    padding-bottom: 0;
    padding-left: 0;
    background: ${colors.secondaryBlack};
    max-width: 296px;
    z-index: 5;
    min-width: 40px;
  }
  .side-panel__content {
    background-color: ${colors.secondaryBlack};
    overflow: hidden;
    width: 300px;
  }
  .side-panel__content::-webkit-scrollbar-track {
    background: ${colors.secondaryBlack};
  }
  .side-panel__content::-webkit-scrollbar-thumb {
    border: 1px solid ${colors.grey};
    background-color: #d8d8d8;
  }
  .side-panel__content::-webkit-scrollbar {
    width: 5px;
  }
`;

const StyledCloseButton = styled.div`
  align-items: center;
  justify-content: center;
  background: ${colors.secondaryBlack};
  height: 40px;
  width: 40px;
  color: ${(props) => props.theme.primaryBtnColor};
  display: flex;
  position: absolute;
  top: 0;
  right: 0;
  margin-left: 32px;
  align-items: flex-start;
  padding-top: 15px;

  :hover {
    cursor: pointer;
    background-color: transparent;
  }
`;

const StyledArrow = styled.i`
  display: inline-block;
  background-image: url(${({ isOpen }: { isOpen: boolean }) =>
    isOpen ? CloseArrowIcon : OpenArrowIcon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  margin-right: 5px;
  height: 20px;
  width: 20px;

  :hover {
    ${styles.blueFilter}
  }
`;

const CloseButtonFactory = () => {
  const CloseButton = ({ onClick, isOpen }: CollapseButtonProps) => (
    <StyledCloseButton className="side-bar__close" onClick={onClick}>
      <StyledArrow isOpen={isOpen}></StyledArrow>
    </StyledCloseButton>
  );
  return CloseButton;
};

function CustomSidebarFactory(CloseButtonFactory: ReturnType<typeof CollapseButtonFactory>) {
  const SideBar = SidebarFactory(CloseButtonFactory);
  const CustomSidebar = (props: any) => (
    <StyledSideBarContainer>
      <SideBar {...props} />
    </StyledSideBarContainer>
  );
  return CustomSidebar;
}

CustomSidebarFactory.deps = [CloseButtonFactory];

export default CustomSidebarFactory;
