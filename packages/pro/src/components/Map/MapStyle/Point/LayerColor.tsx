import React, { useEffect, useMemo, useState } from "react";
import {
  LayerColorRangeSelector,
  LayerColorSelector,
  VisConfigSlider,
  // @ts-ignore
} from "kepler.gl/components";
import styled from "styled-components";

import { DatasetFields, Option } from "../../../../shared/types";
import { Dropdown, MapStyleLabel, SideBarSubSection } from "../../../Common";
import ItemSelector from "../../Common/ItemSelector";
import {
  getLayerChannelConfigProps,
  getLayerConfiguratorProps,
  getVisConfiguratorProps,
} from "../../../../utils";
import { colors } from "../../../../consts";
import { Theme } from "../../../../shared/styles/styles";

type Props = {
  layer: any;
  datasets: any;
  layerTypeOptions: any;
  openModal: Function;
  updateLayerConfig: Function;
  updateLayerType: Function;
  updateLayerVisConfig: Function;
  updateLayerVisualChannelConfig: Function;
  updateLayerColorUI: Function;
};

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

const getInitialColorField = (props: Props) =>
  props.layer.config.colorField
    ? `${props.layer.config.colorField.displayName} (${props.layer.config.colorField.type})`
    : "";

const layerTypes: Option[] = [
  { label: "Point", value: "point" },
  { label: "Heat map", value: "heatmap" },
  { label: "Polygon", value: "geojson" },
];

const LayerColor = (props: Props): JSX.Element => {
  const [options, setOptions] = useState<DatasetFields[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<DatasetFields[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBaseColor, setSelectedBaseColor] = useState<string>(getInitialColorField(props));
  const [selectedLayerType, setSelectedLayerType] = useState<Option>({
    value: props.layer.type,
    label: layerTypes.find((l) => l.value === props.layer.type)?.label || "",
  });
  const defaultLayerType = { label: "Point", value: "point" };

  const visConfiguratorProps = getVisConfiguratorProps(props);
  const layerConfiguratorProps = getLayerConfiguratorProps(props);
  const layerChannelConfigProps = getLayerChannelConfigProps(props);

  const { layer } = props;

  const filteredLayerTypes = useMemo(() => {
    if (selectedLayerType.value === "geojson") {
      return layerTypes.filter((type) => type.value === "geojson");
    } else {
      return layerTypes.filter((type) => type.value !== "geojson");
    }
  }, [selectedLayerType.value]);

  useEffect(() => {
    if (layer && layer.config?.dataId) {
      const fields = props.datasets[layer.config?.dataId].fields;
      setOptions(fields);
      setFilteredOptions(fields);
    }
  }, [props.datasets, layer]);

  const onShowDropdown = (show?: boolean) => {
    setFilteredOptions(options);
    setShowDropdown(show ? show : !showDropdown);
  };

  const handleChange = (event: any) => {
    const filteredData = options.filter((item) => {
      return event.target.value
        ? item.name.toLowerCase().includes(event.target.value.toLowerCase())
        : true;
    });
    setFilteredOptions(filteredData);
  };

  const hideDropdown = () => {
    setShowDropdown(false);
  };

  const onSelectItem = (item: DatasetFields | null) => {
    layerChannelConfigProps.onChange(
      { [layer.visualChannels.color.field]: item },
      layer.visualChannels.color.key,
    );
    if (item) {
      setSelectedBaseColor(`${item.displayName} (${item.type})`);
    } else {
      setSelectedBaseColor("");
    }
    hideDropdown();
  };

  const updateLayerType = (option: Option) => {
    setSelectedLayerType(option);
    props.updateLayerType(option.value);
  };

  return (
    <div>
      <RenderingTitle>Rendering of your data</RenderingTitle>
      <div>
        <Dropdown
          options={filteredLayerTypes}
          value={selectedLayerType ? selectedLayerType : defaultLayerType}
          onChange={updateLayerType}
          theme={Theme.DARK}
        />
      </div>
      <SideBarSubSection>
        {selectedLayerType.value !== "heatmap" && (
          <ItemSelector
            label="Color Based on"
            filteredOptions={filteredOptions}
            options={options}
            isErasable={true}
            handleChange={handleChange}
            onSelectItem={onSelectItem}
            toggleShowDropdown={(show) => onShowDropdown(show)}
            showDropdown={showDropdown}
            placeholder={selectedBaseColor || "Select a field"}
          />
        )}
      </SideBarSubSection>
      <SideBarSubSection>
        <MapStyleLabel>Edit color(s)</MapStyleLabel>
        <ColorSelectorWrapper>
          {props.layer.config.colorField || selectedLayerType.value === "heatmap" ? (
            <LayerColorRangeSelector {...visConfiguratorProps} />
          ) : (
            <LayerColorSelector {...layerConfiguratorProps} />
          )}
        </ColorSelectorWrapper>
      </SideBarSubSection>
      {selectedLayerType.value !== "point" && (
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
