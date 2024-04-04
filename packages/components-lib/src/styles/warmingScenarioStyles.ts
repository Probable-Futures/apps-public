import styled from "styled-components";
import {
  size,
  colors,
  BUTTON_CONTENT_TRANSITION_DURATION,
  GAP_BETWEEN_LABEL_AND_INFO,
} from "@probable-futures/lib/src/consts";
import { Theme } from "@probable-futures/lib/src/types";

import InfoIcon from "../assets/icons/info.svg";
import CancelIcon from "../assets/icons/cancel.svg";
import { whiteFilter } from ".";

export type ButtonContainerProps = {
  showDegreeDescription: boolean;
  isActive: boolean;
};

type ButtonProps = {
  theme: Theme;
  showInfo: boolean;
};

type InfoProps = {
  theme: Theme;
  show: boolean;
};

export const DegreesSeparator = styled.div`
  box-sizing: border-box;
  border-left: 1px solid ${colors.grey};
  height: 29px;
  margin-top: 6px;

  @media (min-width: ${size.tablet}) {
    height: 32px;
  }
`;

export const PopoverContent = styled.div`
  margin: 0 auto;

  p {
    font-weight: 400;
    font-size: 18px;
    line-height: 26px;
    color: ${colors.whiteOriginal};
    margin: 0;
  }

  @media (min-width: ${size.tablet}) {
    padding: 42px 0px;
  }
`;

export const PopoverContainer = styled.div`
  background-color: ${colors.dimBlack};
  opacity: 0.85;
  width: 100%;
  box-shadow: 0 0 10px 0 rgb(0 0 0 / 20%);
  box-sizing: border-box;
  position: absolute;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.2s ease-in-out;
  left: 0;
  
  ${({ isOpen }: { isOpen: boolean }) =>
    isOpen &&
    `
    max-height: 500px;
  `}}
`;

export const YearLabel = styled.span`
  color: ${colors.lightGrey2};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0;
  line-height: 11px;
  pointer-events: none;
  min-height: 11px;
`;

export const Info = styled.div`
  width: 14px;
  height: 14px;
  background-image: url(${InfoIcon});
  background-repeat: no-repeat;
  background-size: 14px auto;
  background-position: center;
  pointer-events: none;
  margin-top: 1px;
  opacity: 0;
  visibility: hidden;
  transition: all ${BUTTON_CONTENT_TRANSITION_DURATION}s ease-in-out;
  ${({ show }: InfoProps) => show && "opacity: 1; visibility: visible;"}
  ${({ theme }: InfoProps) => theme === "dark" && whiteFilter}
`;

export const StyledCancelICon = styled.div`
  position: absolute;
  background-image: url(${CancelIcon});
  background-repeat: no-repeat;
  background-position: center;
  cursor: pointer;
  width: 25px;
  height: 25px;
  top: 24px;
  right: 16px;
  background-size: 25px auto;

  @media (min-width: ${size.tabletMax}) {
    width: 33px;
    height: 33px;
    background-size: 33px auto;
    top: 28px;
    right: 28px;
  }
`;

export const LabelAndInfoContainer = styled.div`
  display: flex;
  align-items: center;
  transition: transform ${BUTTON_CONTENT_TRANSITION_DURATION}s ease-in-out;
  border: 1px solid transparent;
  box-sizing: border-box;
  ${({ showInfo }: { showInfo: boolean }) =>
    showInfo && `transform: translateX(${parseInt(GAP_BETWEEN_LABEL_AND_INFO) / 2}px);`}
`;

export const ButtonLabel = styled.span`
  transition: transform ${BUTTON_CONTENT_TRANSITION_DURATION}s ease-in-out;
  transform: translateX(${GAP_BETWEEN_LABEL_AND_INFO});
  ${({ showInfo }: { showInfo: boolean }) =>
    showInfo && `transform: translateX(-${GAP_BETWEEN_LABEL_AND_INFO});`}
`;

export const BorderVisibleOnFocus = styled.div`
  display: none;
  border: 1px solid ${colors.purple};
  color: ${colors.purple};
  position: absolute;
  width: ${({ width }: { width: string }) => width};
  height: 30px;
  top: 21px;
`;

export const Button = styled.button`
  font-family: LinearSans, Arial, Helvetica, sans-serif;
  font-size: 18px;
  line-height: 29px;
  width: 100%;
  background: none;
  border: none;
  outline: 0;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;

  &:disabled {
    opacity: 0.5;
  }

  &:focus-visible {
    .label-and-info-container {
      color: ${colors.purple};
    }
    ${({ showInfo }: ButtonProps) =>
      showInfo
        ? `
          .button-focus-border {
            display: block;
          }
          `
        : `.label-and-info-container {
            border: 1px solid ${colors.purple};
          }`}
  }
`;

export const ButtonContainer = styled.div`
  position: relative;
  height: 100%;
  border: none;
  box-sizing: border-box;

  ${({ showDegreeDescription }: ButtonContainerProps) =>
    showDegreeDescription &&
    `${Info} {
    filter: invert(21%) sepia(89%) saturate(4669%) hue-rotate(263deg) brightness(99%)
      contrast(104%);
  }`};

  ${({ isActive }: ButtonContainerProps) =>
    isActive &&
    `
    border-color: ${colors.darkPurple};
    min-width: 100px;
    
    &::after,
    &::before {
      content: "";
      display: block;
      position: absolute;
      width: 0;
      height: 0;
      border-style: solid;
      rotate: 270deg;
    }
    
    &::before {
      top: -28px;
      border-color: transparent transparent transparent ${colors.darkPurple};
      border-width: 11px;
      left: calc(50% - 10px);
    }

    &::after {
      top: -26px;
      border-color: transparent transparent transparent ${colors.purple};
      border-width: 10px;
      left: calc(50% - 9px);
    }
  `};

  &:hover {
    button {
      color: ${colors.purple};
    }
    ${Info} {
      filter: invert(21%) sepia(89%) saturate(4669%) hue-rotate(263deg) brightness(99%)
        contrast(104%);
    }
  }
`;

export const ButtonAndSeparator = styled.div`
  display: flex;
  position: relative;
  flex: 1;
  margin: 0;
  padding: 0;
  align-items: center;
  justify-content: space-around;
  height: 100%;
  max-width: 200px;
`;
