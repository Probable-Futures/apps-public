import React from "react";
import { PropsWithChildren } from "react";
import styled from "styled-components";

type Props = {
  title: string;
};

const TabHeaderTile = styled.div`
  font-weight: 500;
  margin: 0px;
  font-size: 32px;
  letter-spacing: 0;
  line-height: 32px;
`;

const StyledHeader = styled.div`
  border-bottom: 1px solid;
  padding-bottom: 10px;
  display: flex;
`;

const DashboardTitle = ({ children, title }: PropsWithChildren<Props>): JSX.Element => {
  return (
    <StyledHeader>
      <TabHeaderTile>{title}</TabHeaderTile>
      {children}
    </StyledHeader>
  );
};

export default DashboardTitle;
