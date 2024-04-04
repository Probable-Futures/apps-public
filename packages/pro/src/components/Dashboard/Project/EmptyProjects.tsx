import React from "react";
import styled from "styled-components";

import GlobeIcon from "../../../assets/icons/dashboard/globe.svg";
import { colors } from "../../../consts";

const Container = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;
  align-items: center;
  width: 100%;
  height: 196px;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  text-align: center;
  background-color: #f5f7ef;
`;

const StyledEmptyText = styled.p`
  height: 16px;
  width: 290px;
  color: ${colors.darkPurple};
  letter-spacing: 0;
  line-height: 16px;
  flex: 0 1 100%;
`;

const StyledGlobeIcon = styled.i`
  background-image: url(${({ icon }: { icon: string }) => icon});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  height: 44px;
  width: 85px;
`;

const EmptyProjects: React.FC = () => {
  return (
    <Container>
      <StyledGlobeIcon icon={GlobeIcon} />
      <StyledEmptyText>You haven't created any projects yet.</StyledEmptyText>
    </Container>
  );
};

export default EmptyProjects;
