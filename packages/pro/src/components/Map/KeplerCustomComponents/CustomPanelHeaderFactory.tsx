import styled from "styled-components";
import { styles } from "@probable-futures/components-lib";

import { colors } from "../../../consts";
import LightArrow from "../../../assets/icons/map/arrow-down-white.svg";

const StyledHeaderWrapper = styled.div`
  background: ${colors.secondaryBlack};
  color: ${colors.primaryWhite};
  text-align: left;
  padding: 16px 16px 0px;
`;

const PFTitle = styled.span`
  height: 28px;
  width: 172px;
  font-family: LinearSans;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.7px;
  line-height: 14px;
`;

const StyledArrow = styled.i`
  background-image: url(${LightArrow});
  background-repeat: no-repeat;
  background-size: 100% auto;
  background-position: center;
  width: 14px;
  height: 14px;
  transform: rotate(90deg);
  margin-right: 10px;
`;

const BackToDahsboardLink = styled.a`
  color: ${colors.primaryWhite} !important;
  display: flex;
  max-width: 165px;

  &:hover {
    color: ${colors.secondaryBlue} !important;
    i {
      ${styles.blueFilter}
    }
  }
`;

function CustomPanelHeaderFactory() {
  const CustomPanelHeaderAction = (props: any) => (
    <StyledHeaderWrapper>
      <BackToDahsboardLink href="/dashboard/projects">
        <StyledArrow />
        <PFTitle>Back to dashboard</PFTitle>
      </BackToDahsboardLink>
    </StyledHeaderWrapper>
  );
  return CustomPanelHeaderAction;
}

export default CustomPanelHeaderFactory;
