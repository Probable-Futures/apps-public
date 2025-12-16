import { useMemo, useState } from "react";
import { VisConfigSlider } from "@kepler.gl/components";
import { Field } from "@kepler.gl/types";

import { MapStyleLabel, SideBarSubSection } from "../../../Common";
import ItemSelector from "../../Common/ItemSelector";
import { getLayerChannelConfigProps, getVisConfiguratorProps } from "../../../../utils";
import MapStyleSectionTitle from "../MapStyleSectionTitle";
import { LayerConfiguratorProps } from "../../KeplerCustomComponents/CustomLayerConfigurator";

const LayerRadius = (props: LayerConfiguratorProps): JSX.Element => {
  const { layer, datasets } = props;

  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const visConfiguratorProps = getVisConfiguratorProps(props);
  const layerChannelConfigProps = getLayerChannelConfigProps(props);

  const property = "isRadius";
  const defaultSwitchValue =
    typeof layer.config.visConfig[property] === "boolean" ? layer.config.visConfig[property] : true;

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

  // Derived Data: Current Size Field Label
  const currentSizeFieldLabel = useMemo(() => {
    const { sizeField } = layer.config;
    return sizeField ? `${sizeField.displayName} (${sizeField.type})` : "";
  }, [layer.config]);

  const onShowDropdown = (show?: boolean) => {
    // Reset search when opening dropdown
    if (show) setSearchTerm("");
    setShowDropdown(show ?? !showDropdown);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const onSelectItem = (item: Field | null) => {
    if (!layer.visualChannels.size) {
      return;
    }
    // Update the configuration via Redux action (layerChannelConfigProps.onChange)
    layerChannelConfigProps.onChange(
      { [layer.visualChannels.size.field]: item },
      layer.visualChannels.size.key,
    );
    setShowDropdown(false);
  };

  const handleSwitchToggle = () => {
    visConfiguratorProps.onChange({
      [property]: !defaultSwitchValue,
    });
  };

  return (
    <div>
      <MapStyleSectionTitle
        hasSwitch={true}
        title="Radius"
        checked={defaultSwitchValue}
        onSwitchToggle={handleSwitchToggle}
      />
      {defaultSwitchValue && (
        <SideBarSubSection>
          <ItemSelector
            label="Radius Based on"
            filteredOptions={filteredOptions}
            options={fieldOptions}
            isErasable={true}
            handleChange={handleSearch}
            onSelectItem={onSelectItem}
            placeholder={currentSizeFieldLabel || "Select a field"}
            toggleShowDropdown={onShowDropdown}
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
