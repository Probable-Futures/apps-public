import { FilterPanelFactory } from "@kepler.gl/components";
import { ALL_FIELD_TYPES } from "@kepler.gl/constants";
import { createSelector } from "reselect";

const climateDataFieldsRegExp = new RegExp(
  "^(data_(1c|1_5c|2c|2_5c|3c))|(data_baseline)_(low|mid|high)$",
);

function CustomFilterPanelFactory(...deps: Parameters<typeof FilterPanelFactory>) {
  const FilterPanel = FilterPanelFactory(...deps) as any;
  class CustomFilterPanel extends FilterPanel {
    // only show current field and field that's not already been used as a filter
    availableFieldsSelector = createSelector(
      this.fieldsSelector,
      this.filterSelector,
      this.nameSelector,
      this.dataIdSelector,
      (fields, filters, name, dataId) =>
        fields.filter(
          (f: any) =>
            f.type &&
            f.type !== ALL_FIELD_TYPES.geojson &&
            (f.name === name ||
              !filters.find((d: any) => d.name === f.name && d.dataId === dataId)) &&
            !climateDataFieldsRegExp.test(f.name),
        ),
    );
  }
  return CustomFilterPanel;
}

CustomFilterPanelFactory.deps = FilterPanelFactory.deps;

export default CustomFilterPanelFactory;
