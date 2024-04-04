import styled from "styled-components";
import InputColor, { Color } from "react-input-color";

import { useMenu } from "../../components/Menu";
import CustomSwitch from "../common/CustomSwitch";
import { Container, Title } from "./Menu.styled";
import { colors } from "../../consts";
import Dropdown from "../common/Dropdown";
import { useTranslation } from "../../contexts/TranslationContext";
import { Projection } from "mapbox-gl";

const Section = styled(Container)`
  padding: 12px 20px 12px 52px;
  ${({ showBorder = true }: { showBorder?: boolean }) =>
    showBorder && `border-bottom: 1px solid ${colors.lightGrey}`};
`;

const ColorPicker = styled.div`
  width: 32px;
  height: 32px;
  border: 1px solid ${colors.lightGrey};
  > span {
    width: 100%;
    height: 100%;
    border: none;
    padding: 0;
  }
`;

const Option = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  ${({ marginBottom = false }: { marginBottom?: boolean }) => marginBottom && "margin-bottom: 8px"};
`;

const OptionLabel = styled.span`
  color: ${colors.darkPurple};
  font-size: 14px;
  letter-spacing: 0;
  line-height: 16px;
  margin-left: 9px;
`;

const SwitchLabel = styled(OptionLabel)`
  flex: 1;
  margin-left: 0;
`;

const mapProjections = [
  { label: "Mercator", value: "mercator" },
  { label: "Globe", value: "globe" },
  { label: "Albers", value: "albers" },
  { label: "Equal Earth", value: "equalEarth" },
  { label: "Equirectangular", value: "equirectangular" },
  { label: "Lambert Conformal Conic", value: "lambertConformalConic" },
  { label: "Natural Earth", value: "naturalEarth" },
  { label: "Winkel Tripel", value: "winkelTripel" },
];
const defaultMapProjectionValue = { value: "", label: "" };

export default function MapStyle(): JSX.Element {
  const {
    mapStyle: {
      landColor,
      setLandColor,
      oceanColor,
      setOceanColor,
      showBoundaries,
      setShowBoundaries,
      showLabels,
      setShowLabels,
      mapProjection,
      setMapProjection,
    },
  } = useMenu();
  const { translate } = useTranslation();
  const colors = [
    {
      title: translate("menu.mapStyle.landColor"),
      value: landColor,
      onChange: (color: Color) => setLandColor(color.hex),
    },
    {
      title: translate("menu.mapStyle.oceanColor"),
      value: oceanColor,
      onChange: (color: Color) => setOceanColor(color.hex),
    },
  ];

  return (
    <Container>
      <Section showBorder={false}>
        <Title>{translate("menu.mapStyle.projection")}</Title>
        <Dropdown
          value={
            mapProjections.find((projection) => projection.value === mapProjection.name) ||
            defaultMapProjectionValue
          }
          options={mapProjections}
          onChange={({ value }: { value: string }) =>
            setMapProjection({ name: value as Extract<Projection["name"], "mercator" | "globe"> })
          }
        />
      </Section>
      <Section>
        {colors.map(({ title, value, onChange }, index) => (
          <Option key={`${value}_${index}`} marginBottom={index === 0}>
            <ColorPicker>
              <InputColor initialValue={value} onChange={onChange} />
            </ColorPicker>
            <OptionLabel>{title}</OptionLabel>
          </Option>
        ))}
      </Section>
      <Section>
        <Option>
          <SwitchLabel>{translate("menu.mapStyle.boundaries")}</SwitchLabel>
          <CustomSwitch
            name="boundaries"
            label={translate(showBoundaries ? "menu.mapStyle.on" : "menu.mapStyle.off")}
            checked={showBoundaries}
            onChange={(checked: boolean) => setShowBoundaries(checked)}
          />
        </Option>
      </Section>
      <Section showBorder={false}>
        <Option>
          <SwitchLabel>{translate("menu.mapStyle.placeLabels")}</SwitchLabel>
          <CustomSwitch
            name="labels"
            label={translate(showLabels ? "menu.mapStyle.on" : "menu.mapStyle.off")}
            checked={showLabels}
            onChange={(checked: boolean) => setShowLabels(checked)}
          />
        </Option>
      </Section>
    </Container>
  );
}
