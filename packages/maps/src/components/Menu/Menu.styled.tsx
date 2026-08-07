import styled from "styled-components";
import { colors } from "../../consts";

/**
 * The sidebar is always SIDEBAR_WIDTH wide and slides left until only
 * SIDEBAR_RAIL_WIDTH shows, so the section icons are sized to exactly fill that
 * rail — see the Icon transform in DrawerItem.
 */
export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_RAIL_WIDTH = 52;
export const SIDEBAR_GUTTER = 20;

export const dividerColor = "#e4e4e4";

type ContainerProps = {
  flexDirection?: "row" | "column";
};

export const Container = styled.div`
  display: flex;
  flex-direction: ${({ flexDirection }: ContainerProps) => flexDirection || "column"};
`;

export const Title = styled.h3`
  margin: 0 0 6px 0;
  color: ${colors.lightGrey2};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.15;
`;

/**
 * Shared by every panel so their contents line up on one gutter. Indented to
 * SIDEBAR_GUTTER rather than to the section title, which buys ~32px of width —
 * enough to stop the switch labels wrapping onto three lines.
 */
export const Section = styled(Container)`
  padding: 14px ${SIDEBAR_GUTTER}px;
  ${({ showBorder = true }: { showBorder?: boolean }) =>
    showBorder && `border-bottom: 1px solid ${dividerColor}`};
`;

type SquareImageButtonProps = {
  src: string;
  selected?: boolean;
};

export const ImageButton = styled.button`
  cursor: pointer;
  background-color: transparent;
  background-image: url(${({ src }: SquareImageButtonProps) => src});
  background-size: calc(100% - 4px) calc(100% - 4px);
  background-position: center;
  background-repeat: no-repeat;
  outline-color: ${colors.purple};
  border: 2px solid
    ${({ selected }: SquareImageButtonProps) => (selected ? colors.purple : "transparent")};
`;

export const SquareImageButton = styled(ImageButton)`
  width: 64px;
  height: 64px;
  margin-right: 16px;
  margin-bottom: 40px;
  > span {
    transform: translateY(43px);
    display: block;
    font-family: Cambon;
    font-size: 14px;
  }
`;

export const RectangleImageButton = styled(ImageButton)`
  width: 153px;
  height: 32px;
  margin-bottom: 8px;
`;
