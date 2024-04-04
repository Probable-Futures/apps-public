import styled from "styled-components";
import { injectIntl } from "react-intl";
// @ts-ignore
import { DatasetTagFactory, SidePanelSection } from "kepler.gl/components";

import CustomFieldSelectorFactory from "./CustomFieldSelectorFactory";

const TooltipConfigWrapper = styled.div`
  .item-selector > div > div {
    overflow: visible;
  }
`;

CustomTooltipConfigFactory.deps = [DatasetTagFactory, CustomFieldSelectorFactory];
function CustomTooltipConfigFactory(_: any, FieldSelector: any) {
  const DatasetTooltipConfig = ({ config, onChange, dataset }: any) => {
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
          />
        ))}
      </TooltipConfigWrapper>
    );
  };

  return injectIntl(TooltipConfig);
}

export default CustomTooltipConfigFactory;
