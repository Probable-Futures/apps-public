import type { Meta, StoryObj } from "@storybook/react";
import { components } from "@probable-futures/components-lib";
import { useArgs } from "@storybook/client-api";
import * as DocBlock from "@storybook/blocks";

import AdditionalDocs from "./AdditionalDocs";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof components.DegreeSlider> = {
  title: "PF/DegreeSlider",
  component: components.DegreeSlider,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="The slider to select between different warming scenarios."
            whenAndHowToUse="It is used as part of the mapBuilder menu to switch between different warming scenarios."
            currentUsage="Maps page"
          />
          <DocBlock.Heading>Props</DocBlock.Heading>
          <DocBlock.Controls />
        </>
      ),
    },
  },
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof components.DegreeSlider>;

export const Primary: Story = (args: any) => {
  const [, updateArgs] = useArgs();
  const handleWarmingScenarioClick = (_event: React.ChangeEvent<{}>, newDegree: number) => {
    updateArgs({ degrees: newDegree });
  };

  return <components.DegreeSlider {...args} onChange={handleWarmingScenarioClick} />;
};

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
Primary.args = {
  degrees: 2,
  title: "Change in total anual precipitation",
  min: 0.5,
  max: 3,
};
