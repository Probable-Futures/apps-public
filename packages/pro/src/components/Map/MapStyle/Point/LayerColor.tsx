import { useMemo, useState } from "react";
import {
  LayerColorRangeSelector,
  LayerColorSelector,
  VisConfigSlider,
} from "@kepler.gl/components";
import styled from "styled-components";
import { Field } from "@kepler.gl/types";

import { Dropdown, MapStyleLabel, SideBarSubSection } from "../../../Common";
import ItemSelector from "../../Common/ItemSelector";
import {
  getLayerChannelConfigProps,
  getLayerConfiguratorProps,
  getVisConfiguratorProps,
} from "../../../../utils";
import { colors } from "../../../../consts";
import { Theme } from "../../../../shared/styles/styles";
import { LayerConfiguratorProps } from "../../KeplerCustomComponents/CustomLayerConfigurator";

const ColorSelectorWrapper = styled.div`
  margin-top: 6px;
`;

const OpacitySliderWrapper = styled.div`
  margin-bottom: 24px;
  height: 70px;
  padding-top: 5px;
`;

const RenderingTitle = styled.div`
  height: 20px;
  width: 155px;
  color: ${colors.primaryWhite};
  font-family: LinearSans;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  line-height: 20px;
  margin-bottom: 24px;
  padding-top: 12px;
`;

type Option = {
  value: string | null;
  label: string;
};

const layerTypes: Option[] = [
  { label: "Point", value: "point" },
  { label: "Heat map", value: "heatmap" },
  { label: "Polygon", value: "geojson" },
];

const defaultLayerType = { label: "Point", value: "point" };

const LayerColor = (props: LayerConfiguratorProps): JSX.Element => {
  const { layer, datasets, updateLayerType } = props;

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const visConfiguratorProps = getVisConfiguratorProps(props);
  const layerConfiguratorProps = getLayerConfiguratorProps(props);
  const layerChannelConfigProps = getLayerChannelConfigProps(props);

  // Derived Data: Get all available fields (options)
  const fieldOptions = useMemo(() => {
    if (layer && layer.config?.dataId && datasets[layer.config.dataId]) {
      return datasets[layer.config.dataId].fields;
    }
    return [];
  }, [datasets, layer]);

  // Derived Data: Filter fields based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return fieldOptions;
    return fieldOptions.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [fieldOptions, searchTerm]);

  // Derived Data: Current Color Label
  const currentColorFieldLabel = useMemo(() => {
    const { colorField } = layer.config;
    return colorField ? `${colorField.displayName} (${colorField.type})` : "";
  }, [layer.config]);

  // Derived Data: Current Layer Type Option
  const selectedLayerTypeOption = useMemo(() => {
    return layerTypes.find((l) => l.value === layer.type) || defaultLayerType;
  }, [layer.type]);

  const filteredLayerTypes = useMemo(() => {
    const isGeoJson = layer.type === "geojson";
    return isGeoJson
      ? layerTypes.filter((type) => type.value === "geojson")
      : layerTypes.filter((type) => type.value !== "geojson");
  }, [layer.type]);

  const onShowDropdown = (show?: boolean) => {
    // Reset search when opening dropdown
    if (show) setSearchTerm("");
    setShowDropdown(show ?? !showDropdown);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const onSelectItem = (item: Field | null) => {
    layerChannelConfigProps.onChange(
      { [layer.visualChannels.color.field]: item },
      layer.visualChannels.color.key,
    );
    setShowDropdown(false);
  };

  const handleLayerTypeChange = (option: Option) => {
    if (option.value && option.value !== layer.type) {
      updateLayerType(option.value);
    }
  };

  return (
    <div>
      <RenderingTitle>Rendering of your data</RenderingTitle>
      <div>
        <Dropdown
          options={filteredLayerTypes}
          value={selectedLayerTypeOption}
          onChange={handleLayerTypeChange}
          theme={Theme.DARK}
        />
      </div>
      <SideBarSubSection>
        {selectedLayerTypeOption.value !== "heatmap" && (
          <ItemSelector
            label="Color Based on"
            filteredOptions={filteredOptions}
            options={fieldOptions}
            isErasable={true}
            handleChange={handleSearch}
            onSelectItem={onSelectItem}
            toggleShowDropdown={onShowDropdown}
            showDropdown={showDropdown}
            placeholder={currentColorFieldLabel || "Select a field"}
          />
        )}
      </SideBarSubSection>
      <SideBarSubSection>
        <MapStyleLabel>Edit color(s)</MapStyleLabel>
        <ColorSelectorWrapper>
          {layer.config.colorField || selectedLayerTypeOption.value === "heatmap" ? (
            <LayerColorRangeSelector {...visConfiguratorProps} />
          ) : (
            <LayerColorSelector {...layerConfiguratorProps} />
          )}
        </ColorSelectorWrapper>
      </SideBarSubSection>
      {selectedLayerTypeOption.value !== "point" && (
        <OpacitySliderWrapper>
          <div>
            <VisConfigSlider {...layer.visConfigSettings.opacity} {...visConfiguratorProps} />
          </div>
        </OpacitySliderWrapper>
      )}
    </div>
  );
};

export default LayerColor;
