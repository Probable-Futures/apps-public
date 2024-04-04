import React, { memo } from "react";
import styled from "styled-components";

import { useMapData } from "../../../../contexts/DataContext";
import { colors } from "../../../../consts";
import MapStyleSectionTitle from "../MapStyleSectionTitle";
import { StyledDivider } from "../../../Common";
import useProjectUpdate from "../../../../utils/useProjectUpdate";
import { useAppSelector } from "../../../../app/hooks";

const Container = styled.div`
  background-color: ${colors.darkPurpleBackground};
  padding: 12px;
`;

const BinsWrapper = styled.div`
  color: ${colors.primaryWhite};
  font-size: 14px;
  letter-spacing: 0;
  line-height: 16px;
`;

const Title = styled.div`
  display: flex;
  align-items: baseline;
`;

const BaseMapStyles = () => {
  const { selectedClimateData } = useMapData();
  const { updateProject } = useProjectUpdate();
  const { showBorders, showLabels } = useAppSelector(
    (state) => state.project.mapConfig.pfMapConfig,
  );

  if (!selectedClimateData) {
    return null;
  }

  return (
    <>
      <Container>
        <Title>
          <MapStyleSectionTitle title="Base map styles" hasSwitch={false} />
        </Title>
        <BinsWrapper>
          <MapStyleSectionTitle
            title="Geopolitical boundaries"
            hasSwitch
            isSubtitle
            checked={showBorders}
            onSwitchToggle={() =>
              updateProject({
                mapStyleConfig: {
                  key: "showBorders",
                  value: !showBorders,
                },
              })
            }
          />
          <MapStyleSectionTitle
            title="Place labels"
            hasSwitch
            isSubtitle
            checked={showLabels}
            onSwitchToggle={() =>
              updateProject({
                mapStyleConfig: {
                  key: "showLabels",
                  value: !showLabels,
                },
              })
            }
          />
        </BinsWrapper>
      </Container>
      <StyledDivider />
    </>
  );
};

export default memo(BaseMapStyles);
