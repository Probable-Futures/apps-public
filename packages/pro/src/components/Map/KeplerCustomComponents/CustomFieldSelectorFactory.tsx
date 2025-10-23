import { FieldListItemFactoryFactory, FieldSelector } from "@kepler.gl/components";

import TooltipItemSelector from "../MapStyle/Tooltip/TooltipItemSelector";

const defaultDisplayOption = (d: any) => d.displayName || d.name;

function CustomFieldSelectorFactory() {
  return class CustomFieldSelector extends (FieldSelector as any) {
    constructor(props: any) {
      super(props);
      this.render = this.render.bind(this);
    }

    render() {
      return (
        <TooltipItemSelector
          getOptionValue={(d: any) => d}
          displayOption={defaultDisplayOption}
          selectedItems={this.selectedItemsSelector(this.props)}
          options={this.fieldOptionsSelector(this.props)}
          onChange={this.props.onSelect}
          multiSelect={this.props.multiSelect}
        />
      );
    }
  };
}

CustomFieldSelectorFactory.deps = [FieldListItemFactoryFactory];

export default CustomFieldSelectorFactory;
