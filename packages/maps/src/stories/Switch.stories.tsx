import type { Meta, StoryObj } from "@storybook/react";
import * as DocBlock from "@storybook/blocks";
import { useArgs } from "@storybook/client-api";

import AdditionalDocs from "./AdditionalDocs";
import { components } from "@probable-futures/components-lib";

const meta: Meta<typeof components.Switch> = {
  title: "PF/MapKeyToggle",
  component: components.Switch,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="The switch used for toggling two inputs."
            whenAndHowToUse="Used inside the key to allow user to switch between different units to better understand the values inside each tileset. Eg. toggle between mm and inches.            "
            currentUsage="Maps page"
          />
          <DocBlock.Heading>Props</DocBlock.Heading>
          <DocBlock.Controls />
        </>
      ),
    },
  },
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
};

export default meta;
type Story = StoryObj<typeof components.Switch>;

export const Primary: Story = (args: any) => {
  const [, updateArgs] = useArgs();
  const onChange = () => {
    updateArgs({ isChecked: !args.isChecked });
  };

  return <components.Switch {...args} onChange={onChange} />;
};

Primary.args = {
  isChecked: true,
  left: "mm",
  right: "in",
  onChange: () => {},
};
