import type { Meta, StoryObj } from "@storybook/react";
import { components } from "@probable-futures/components-lib";
import * as DocBlock from "@storybook/blocks";

import { climateZonesDescriptions } from "./assets/mock-data/climate-zone-descs.data";
import { datasets } from "./assets/mock-data/datasets.data";
import AdditionalDocs from "./AdditionalDocs";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof components.MapDescription> = {
  title: "PF/MapDescription",
  component: components.MapDescription,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="Description of each map that can be displayed inside a modal."
            whenAndHowToUse="Use it display a description about each, can be accessed anywhere on the maps page."
            currentUsage="Maps Page"
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
type Story = StoryObj<typeof components.MapDescription>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    datasetDescriptionResponse: climateZonesDescriptions,
    selectedDataset: datasets[datasets.length - 1],
  },
};
