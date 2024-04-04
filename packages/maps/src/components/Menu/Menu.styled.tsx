import styled from "styled-components";
import { colors } from "../../consts";

type ContainerProps = {
  flexDirection?: "row" | "column";
};

export const Container = styled.div`
  display: flex;
  flex-direction: ${({ flexDirection }: ContainerProps) => flexDirection || "column"};
`;

export const Title = styled.h3`
  margin: 0 0 5px 0;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 1.15;
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
