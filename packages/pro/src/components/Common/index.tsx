import styled from "styled-components";
import { Divider } from "@material-ui/core";

import { size } from "../../consts";
import Pagination from "./Pagination";
import Dropdown from "./Dropdown";
import { colors } from "../../consts";
import LogoIcon from "../../assets/icons/logo-white.svg";

type ButtonProps = {
  isDisabled?: boolean;
};

export const StyledItemIcon = styled.i`
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  margin-right: 5px;
  height: 14px;
  width: 14px;
  flex: none;
`;

export const StyledItemAction = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  span,
  a {
    color: ${colors.black};
    line-height: 0.9em;
    border-bottom: 1px solid;
    text-decoration: none;
    color: ${colors.black};
    font-size: 14px;
    letter-spacing: 0;
    :hover {
      color: ${colors.blue};
    }
  }
`;

export const GridActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 30px;
  align-items: center;
  @media (max-width: ${size.tablet}) {
    justify-content: space-evenly !important;
  }
  flex: 2;
`;

export const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 4;

  .title {
    color: ${colors.secondaryBlack};
    font-size: 24px;
    letter-spacing: 0;
    line-height: 32px;
    font-family: Cambon;
    border-bottom: 1px solid ${colors.secondaryBlack};
    text-decoration: none;
  }
  .date-info {
    color: ${colors.darkPurple};
    font-size: 12px;
    letter-spacing: 0;
    line-height: 18px;
    font-family: RelativeMono;
    font-style: italic;
    margin-top: 5px;
  }
`;

export const ItemContainer = styled.div`
  display: flex;
  gap: 10px;
  padding: 20px 0px;
  flex-flow: row wrap;
`;

export const StyledCloseIcon = styled.i`
  display: inline-block;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  height: 16px;
  width: 16px;
`;

export const ModalHeader = styled.div`
  display: flex;
  margin-bottom: 20px;
  align-items: center;
`;

export const ModalClose = styled.button`
  margin-left: auto;
  cursor: pointer;
  height: 16px;
  width: 16px;
  background-color: transparent;
  border: none;
  margin-right: 5px;
`;

export const ModalTitle = styled.div`
  height: 32px;
  width: 80%;
  color: ${colors.black};
  font-family: LinearSans;
  font-size: 24px;
  letter-spacing: 0;
  line-height: 32px;
`;

export const Button = styled.button`
  cursor: pointer;
  font-size: 16px;
  float: right;
  display: inline-block;
  height: 40px;
  width: 130px;
  margin-top: 20px;
  color: ${colors.primaryWhite};
  background-color: ${colors.secondaryBlack};
  border: none;

  &:hover {
    background-color: ${colors.skyBlue};
  }

  ${({ isDisabled }: ButtonProps) => isDisabled && `pointer-events: none; opacity: 0.5;`}
`;

export const LargeButton = styled(Button)`
  margin-left: auto;
  margin-top: 0px;
  width: 203px;
`;

export const PanelContent = styled.div.attrs({
  className: "side-panel-panel__content",
})`
  background-color: ${colors.darkPurpleBackground};
  padding-top: 8px;
`;

export const SideBarSubSection = styled.div`
  margin-top: 8px;
`;

export const StyledPanelHeader = styled.div`
  background-color: ${colors.darkPurpleBackground};
  border-left: 3px solid
    rgb(
      ${(props: any) =>
        props.labelRCGColorValues ? props.labelRCGColorValues.join(",") : "transparent"}
    );
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: ${(props) => props.theme.panelHeaderBorderRadius};
  transition: ${(props) => props.theme.transition};
  padding-bottom: 16px;
`;

export const PanelHeaderTitle = styled.span`
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  line-height: 20px;
`;

export const PanelHeaderSubTitle = styled.span`
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 12px;
  letter-spacing: 0px;
  line-height: 20px;
`;

export const PanelHeaderContent = styled.div`
  display: flex;
  align-items: center;
  color: ${(props) => props.theme.textColor};

  .icon {
    color: ${(props) => props.theme.labelColor};
    display: flex;
    align-items: center;
    margin-right: 12px;
  }
`;

export const StyledDivider = styled(Divider)`
  background-color: ${({ color }: { color?: string }) => `${color || "#424242"} !important`};
`;

export const MapStyleLabel = styled.label`
  color: ${colors.midGrey};
  font-family: LinearSans;
  font-size: 14px;
  letter-spacing: 0.23px;
  line-height: 16px;
`;

export const PfProLogo = styled.i`
  display: inline-block;
  background-image: url(${LogoIcon});
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% auto;
  margin-right: 5px;
  height: 39px;
  width: 106px;
  position: absolute;
  bottom: 16px;
  left: 16px;
`;

export const EmptyFactory = () => () => null;

export { Pagination, Dropdown };
