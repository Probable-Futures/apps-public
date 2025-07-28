import styled from "styled-components";
import { colors } from "@probable-futures/lib";

type ControlButtonProps = {
  first?: boolean;
  last?: boolean;
  active?: boolean;
  mode?: "light" | "dark";
};

export const ButtonContainer = styled.div`
  width: 100%;
  height: 100%;
`;

export const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 35px;
  height: 35px;
  border: none;
  outline: 0;
  background-color: transparent;
  font-family: "LinearSans";
  color: ${colors.textBlack};
  cursor: pointer;
  padding: 0;
  ${({ first }: ControlButtonProps) =>
    first && "border-top-left-radius: 6px;border-top-right-radius: 6px;"}
  ${({ last }: ControlButtonProps) =>
    last
      ? "border-bottom-left-radius: 6px;border-bottom-right-radius: 6px;"
      : "border-bottom: 1px solid rgba(151, 151, 151, 0.5);"}

  ${({ disabled }) =>
    disabled &&
    `
    opacity: 50%;
    pointer-events: none;
    `}

  ${({ mode }: ControlButtonProps) =>
    mode === "dark"
      ? ` path {
    fill: ${colors.white};
  }`
      : ` path {
    fill: ${colors.darkPurple};
  }`}

  &:hover {
    ${({ mode }: ControlButtonProps) =>
      mode === "dark"
        ? `background-color: ${colors.white};
          color: ${colors.darkPurple};
          path {
            fill: ${colors.darkPurple};
          }`
        : `background-color: ${colors.lightPurpleWithOpacity};
          color: ${colors.white};
          path {
            fill: ${colors.darkPurple};
          }`}
  }

  ${({ active }: ControlButtonProps) =>
    active &&
    ` background-color: ${colors.lightPurpleWithOpacity};
      color: ${colors.white};
      path {
        fill: ${colors.darkPurple};
      }`}
`;

export const Group = styled.div`
  flex-direction: column;
  border-radius: 6px;
  outline: 0;
  padding: 0;
  display: flex;
  position: absolute;
  right: 18px;
  border: 1px solid ${colors.grey};
`;
