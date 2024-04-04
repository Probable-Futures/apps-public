import { memo } from "react";
import styled from "styled-components";
import { styles } from "@probable-futures/components-lib";

import LeftIcon from "../../assets/icons/dashboard/left.svg";
import RightIcon from "../../assets/icons/dashboard/right.svg";
import { PageInfo } from "../../shared/types";
import { itemsPerPage } from "../../consts/dashboardConsts";
import { colors } from "../../consts";

const Container = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 40px;
`;

const ArrowIcon = styled.i`
  display: inline-block;
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  height: 16px;
  width: 16px;
  transform: scaleX(-1);
`;

const StyledPageText = styled.div`
  color: #1b1a1c;
  font-family: LinearSans;
  font-size: 12px;
  letter-spacing: 0;
  line-height: 32px;
  margin-right: 20px;
`;

const StyledArrowBox = styled.div`
  box-sizing: border-box;
  height: 32px;
  width: 32px;
  border: 1px solid ${colors.secondaryBlack};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: ${({ inactive }: { inactive: boolean }) => (inactive ? "0.5" : "1")};
  :last-child {
    margin-left: 12px;
  }
  &:hover {
    border: 1px solid ${colors.secondaryBlue};
    color: ${colors.secondaryBlue};
    i {
      ${styles.blueFilter}
    }
  }
  pointer-events: ${({ inactive }: { inactive: boolean }) => (inactive ? "none" : "all")};
`;

type Props = {
  total: number;
  pageInfo: PageInfo;
  isLoading: boolean;
  offset: number;
  onPageChange: (offest: number) => void;
  setOffset: (offset: number) => void;
};

const Pagination = ({
  total,
  pageInfo,
  onPageChange,
  isLoading,
  offset,
  setOffset,
}: Props): JSX.Element => {
  const currentPage = offset + 1;
  const upToPage = Math.min(total, offset + itemsPerPage);

  const nextPage = () => {
    if (pageInfo.hasNextPage && !isLoading) {
      const newOffset = offset + itemsPerPage;
      setOffset(newOffset);
      onPageChange(newOffset);
    }
  };

  const previousPage = () => {
    if (pageInfo.hasPreviousPage && !isLoading) {
      const newOffset = offset - itemsPerPage;
      setOffset(newOffset);
      onPageChange(newOffset);
    }
  };

  return (
    <Container>
      <StyledPageText>
        {currentPage} - {upToPage} of {total}
      </StyledPageText>
      <StyledArrowBox onClick={previousPage} inactive={!pageInfo.hasPreviousPage || isLoading}>
        <ArrowIcon icon={RightIcon} />
      </StyledArrowBox>
      <StyledArrowBox onClick={nextPage} inactive={!pageInfo.hasNextPage || isLoading}>
        <ArrowIcon icon={LeftIcon} />
      </StyledArrowBox>
    </Container>
  );
};

export default memo(Pagination);
