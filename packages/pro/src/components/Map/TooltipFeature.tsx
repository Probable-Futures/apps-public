import styled, { css } from "styled-components";
import { types, consts } from "@probable-futures/lib";

type Props = {
  feature: types.PopupFeature;
  dataset?: types.Map;
  degreesOfWarming: number | undefined;
};

const textStyles = css`
  color: #000000;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
`;

const Container = styled.div`
  z-index: 1;
  ul {
    list-style-position: inside;
    padding-left: 0;
    padding-right: 0;
  }
  li {
    color: #000000;
  }
`;

const NoDataText = styled.span`
  display: block;
  ${textStyles};
  text-align: center;
  margin-top: 10px;
`;

const Value = styled.span`
  margin: 18px 5px 0px;
  margin-left: -5px;
  ${textStyles};
`;

const Label = styled.span`
  color: #000000;
  font-size: 13px;
  letter-spacing: 0;
  line-height: 10px;
`;

const Title = styled.span`
  display: block;
  color: #1c101e;
  font-size: 13px;
  font-weight: 600;
  line-height: 11px;
  margin-right: 26px;
`;

export default function TooltipFeature({ feature, dataset, degreesOfWarming }: Props): JSX.Element {
  const degrees = consts.degreesOptions.find((option) => option.value === degreesOfWarming)?.label;

  return (
    <Container>
      {dataset && (
        <Title>
          {dataset.name || dataset.dataset.name} at {degrees}
        </Title>
      )}
      {feature.selectedData.mid === undefined ? (
        <NoDataText>No data here</NoDataText>
      ) : (
        <ul>
          {feature.selectedData.low !== undefined && (
            <li>
              <Value>{feature.selectedData.low}</Value>
              <Label>(10th percentile)</Label>
            </li>
          )}
          <li>
            <Value>{feature.selectedData.mid}</Value>
            <Label>(Average)</Label>
          </li>
          {feature.selectedData.high !== undefined && (
            <li>
              <Value>{feature.selectedData.high}</Value>
              <Label>(90th percentile)</Label>
            </li>
          )}
        </ul>
      )}
    </Container>
  );
}
