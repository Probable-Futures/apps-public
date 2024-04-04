import React from "react";
import styled from "styled-components";
import { colors } from "../../consts";

type Props = {
  title: string;
  isSelected: boolean;
  isHeader: boolean;
  index: number;
  onTabClick: (index: number) => void;
};

type StyledTabButtonProps = {
  isSelected: boolean;
  isHeader: boolean;
};

const StyledListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: center;

  :not(:last-child) {
    margin-right: 25px;
  }
`;

const StyledTabButton = styled.span`
  outline: 0;
  border: none;
  cursor: pointer;
  height: 30px;
  padding-bottom: 2px;
  color: ${colors.secondaryBlack};
  letter-spacing: 0;
  line-height: 28px;
  font-family: LinearSans;
  font-size: ${({ isHeader }: StyledTabButtonProps) => (isHeader ? "16px;" : "14px;")}
  background: transparent;
  border-bottom: ${({ isSelected, isHeader }: StyledTabButtonProps) =>
    isSelected
      ? `3px solid ${isHeader ? colors.purple : colors.secondaryBlack}`
      : "3px solid transparent"};

  &:hover {
    color: ${colors.purple};
    border-bottom: 3px solid ${colors.purple};
  }
`;

const TabTitle: React.FC<Props> = ({ title, isSelected, index, onTabClick, isHeader }) => {
  return (
    <StyledListItem>
      <StyledTabButton
        isSelected={isSelected}
        isHeader={isHeader}
        onClick={() => onTabClick(index)}
      >
        {title}
      </StyledTabButton>
    </StyledListItem>
  );
};

export default TabTitle;
