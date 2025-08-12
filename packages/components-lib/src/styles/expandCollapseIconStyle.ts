import styled from "styled-components";
import { size } from "@probable-futures/lib";

export const ExpandCollapseIcon = styled.div<{ isOpen: boolean }>`
  width: 30px;
  height: 30px;
  background-color: black;
  border-radius: 50%; /* Makes it a circle */
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(${({ isOpen }) => (isOpen ? "180deg" : "0deg")}); /* Flip when open */
  transition: transform 0.3s ease;

  @media (min-width: ${size.laptop}) {
    width: 29px;
    height: 29px;
  }

  &::before {
    content: "";
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid white;
  }
`;
