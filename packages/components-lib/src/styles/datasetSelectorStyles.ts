import styled, { keyframes } from "styled-components";
import { colors, size } from "@probable-futures/lib";

export const fadeInAnimation = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

export const AccordionTitle = styled.div<{ isCollapsed: boolean }>`
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  padding-bottom: ${({ isCollapsed }) => (isCollapsed ? "10px" : "0")};
  align-items: center;
  border-bottom: 1px solid;
  border-bottom-color: ${({ isCollapsed }) => (isCollapsed ? colors.grey : "transparent")};
  transition: border-bottom-color 0.3s ease-in-out, padding-bottom 0.3s ease-in-out;
  height: 60px;

  &:last-child {
    border-bottom: none;
  }
`;

export const AccordionContent = styled.div<{ isVisible: boolean }>`
  max-height: ${({ isVisible }) => (isVisible ? "1000px" : "0")};
  overflow: hidden;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;

  &:last-child {
    padding-bottom: 0;
  }
`;

export const MainTitle = styled.div.attrs<{
  isOpen: boolean;
}>((props) => props)<{
  isOpen: boolean;
}>`
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  padding: 0px 18px 0px 15px;
  ${({ isOpen }) => isOpen && `border-bottom: 1px solid ${colors.grey};`}
  font-size: 10px;
  align-items: center;
  transition: background-color 0.3s ease;
  height: 60px;

  @media (min-width: ${size.laptop}) {
    height: 78px;
    padding: 0px 23px 0px 40px;
  }

  &:hover {
    background-color: ${colors.secondaryWhite};
  }
`;

export const SignButton = styled.span`
  margin-left: 5px;
  background-color: ${colors.cream};
  border: 1px solid transparent;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
`;

export const Section = styled.div<{ isFirstChild: boolean }>`
  padding: 0 10px;
  align-items: center;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  padding: 0px 18px 0px 15px;

  border-top: ${({ isFirstChild }) => (!isFirstChild ? `1px solid ${colors.grey}` : "none")};
  @media (min-width: ${size.laptop}) {
    padding: 0px 23px 0px 40px;
  }
`;

export const AllContent = styled.div<{ isVisible: boolean }>`
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  transform: ${({ isVisible }) => (isVisible ? "translateY(0)" : "translateY(-10px)")};
  transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  height: ${({ isVisible }) => (isVisible ? "auto" : "0")};
  overflow: hidden;
`;

export const ViewAllMaps = styled.div`
  padding-bottom: 5px;
  height: 60px;
  text-decoration: underline;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

export const Label = styled.div<{ isSelected: boolean }>`
  padding: 10px 10px;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 6px;
  background-color: ${({ isSelected }) =>
    isSelected ? `${colors.lightPurple}!important` : "transparent"};

  &:hover {
    background-color: ${colors.lightPurpleWithOpacity};
  }
`;

export const SvgIcon = styled.svg`
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1;
`;

export const Title = styled.span<{ animate: boolean }>`
  display: inline-block;
  opacity: ${({ animate }) => (animate ? 0 : 1)};
  animation: ${({ animate }) => (animate ? fadeInAnimation : "none")} 0.3s ease-out forwards;
  font-size: 18px;
  font-weight: 600;
`;
