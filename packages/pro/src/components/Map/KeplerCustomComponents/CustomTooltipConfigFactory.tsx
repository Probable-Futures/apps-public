import styled from "styled-components";
import { injectIntl } from "react-intl";
import { DatasetTagFactory, FieldSelectorFactory, SidePanelSection } from "@kepler.gl/components";
import { KeplerTable } from "@kepler.gl/table";

import CustomFieldSelectorFactory from "./CustomFieldSelectorFactory";

const TooltipConfigWrapper = styled.div`
  .item-selector > div > div {
    overflow: visible;
  }
`;

type DatasetTooltipConfigProps = {
  config: {
    fieldsToShow: {
      [key: string]: { name: string; format: string | null }[];
    };
    compareMode: boolean;
    compareType: string | null;
  };
  onChange: (config: {
    fieldsToShow: {
      [key: string]: { name: string; format: string | null }[];
    };
    compareMode: boolean;
    compareType: string | null;
  }) => void;
  dataset: KeplerTable;
  onDisplayFormatChange: (dataId: string, column: string, displayFormat: string) => void;
};

CustomTooltipConfigFactory.deps = [DatasetTagFactory, CustomFieldSelectorFactory];
function CustomTooltipConfigFactory(
  _DatasetTag: ReturnType<typeof DatasetTagFactory>,
  FieldSelector: ReturnType<typeof FieldSelectorFactory>,
) {
  const DatasetTooltipConfig = ({ config, onChange, dataset }: DatasetTooltipConfigProps) => {
    if (!dataset) {
      return null;
    }
    const dataId = dataset.id;
    return (
      <SidePanelSection key={dataId}>
        <FieldSelector
          fields={dataset.fields}
          value={config.fieldsToShow[dataId]}
          onSelect={(selected: any) => {
            const newConfig = {
              ...config,
              fieldsToShow: {
                ...config.fieldsToShow,
                [dataId]: selected.map(
                  (f: any) =>
                    config.fieldsToShow[dataId].find(
                      (tooltipField: any) => tooltipField.name === f.name,
                    ) || {
                      name: f.name,
                      format: null,
                    },
                ),
              },
            };
            onChange(newConfig);
          }}
          closeOnSelect={false}
          multiSelect
          inputTheme="secondary"
        />
      </SidePanelSection>
    );
  };

  const TooltipConfig = ({ config, datasets, onChange, intl }: any) => {
    return (
      <TooltipConfigWrapper>
        {Object.keys(config.fieldsToShow).map((dataId) => (
          <DatasetTooltipConfig
            key={dataId}
            config={config}
            onChange={onChange}
            dataset={datasets[dataId]}
            onDisplayFormatChange={() => {}}
          />
        ))}
      </TooltipConfigWrapper>
    );
  };

  return injectIntl(TooltipConfig);
}

export default CustomTooltipConfigFactory;
