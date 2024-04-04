import React, { useEffect, useState } from "react";
import {
  VisConfigSlider,
  // @ts-ignore
} from "kepler.gl/components";

import { DatasetFields } from "../../../../shared/types";
import { MapStyleLabel, SideBarSubSection } from "../../../Common";
import ItemSelector from "../../Common/ItemSelector";
import { getLayerChannelConfigProps, getVisConfiguratorProps } from "../../../../utils";
import MapStyleSectionTitle from "../MapStyleSectionTitle";

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

const getInitialSizeField = (props: Props) =>
  props.layer.config.sizeField
    ? `${props.layer.config.sizeField.displayName} (${props.layer.config.sizeField.type})`
    : "";

const LayerRadius = (props: Props): JSX.Element => {
  const [options, setOptions] = useState<DatasetFields[]>([]);
  const [filteredOptions, setFilteredOptions] = useState<DatasetFields[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedBaseRadius, setSelectedBaseRadius] = useState<string>(getInitialSizeField(props));

  const visConfiguratorProps = getVisConfiguratorProps(props);
  const layerChannelConfigProps = getLayerChannelConfigProps(props);

  const { layer } = props;
  const property = "isRadius";
  const defaultSwitchValue =
    typeof layer.config.visConfig[property] === "boolean" ? layer.config.visConfig[property] : true;

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
    if (!layer.visualChannels.size) {
      return;
    }
    layerChannelConfigProps.onChange(
      { [layer.visualChannels.size.field]: item },
      layer.visualChannels.size.key,
    );
    if (item) {
      setSelectedBaseRadius(`${item.displayName} (${item.type})`);
    } else {
      setSelectedBaseRadius("");
    }
    hideDropdown();
  };

  return (
    <div>
      <MapStyleSectionTitle
        hasSwitch={true}
        title="Radius"
        checked={defaultSwitchValue}
        onSwitchToggle={() =>
          visConfiguratorProps.onChange({
            [property]: !defaultSwitchValue,
          })
        }
      />
      {defaultSwitchValue && (
        <SideBarSubSection>
          <ItemSelector
            label="Radius Based on"
            filteredOptions={filteredOptions}
            options={options}
            isErasable={true}
            handleChange={handleChange}
            onSelectItem={onSelectItem}
            placeholder={selectedBaseRadius || "Select a field"}
            toggleShowDropdown={(show) => onShowDropdown(show)}
            showDropdown={showDropdown}
          />
        </SideBarSubSection>
      )}
      {defaultSwitchValue && (
        <SideBarSubSection>
          <MapStyleLabel>Radius</MapStyleLabel>
          {!layer.config.sizeField ? (
            <VisConfigSlider
              {...layer.visConfigSettings.radius}
              {...visConfiguratorProps}
              label={false}
              disabled={Boolean(layer.config.sizeField)}
            />
          ) : (
            <VisConfigSlider
              {...layer.visConfigSettings.radiusRange}
              {...visConfiguratorProps}
              label={false}
              disabled={!layer.config.sizeField || layer.config.visConfig.fixedRadius}
            />
          )}
        </SideBarSubSection>
      )}
    </div>
  );
};

export default LayerRadius;
