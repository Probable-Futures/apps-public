import type { Meta, StoryObj } from "@storybook/react";
import * as DocBlock from "@storybook/blocks";

import { components } from "@probable-futures/components-lib";
import { datasets } from "./assets/mock-data/datasets.data";
import AdditionalDocs from "./AdditionalDocs";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof components.DatasetSelector> = {
  title: "PF/DatasetSelector",
  component: components.DatasetSelector,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="Contains a list of the latest Probable Futures maps categorized by their volume."
            whenAndHowToUse="It is used as part of the header to display the list of all public maps under their respective category."
            currentUsage="Maps page"
          />
          <DocBlock.Heading>Props</DocBlock.Heading>
          <DocBlock.Controls />
        </>
      ),
    },
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof components.DatasetSelector>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    value: {
      value: datasets[0].slug || "",
      label: datasets[0].name,
    },
    datasets: datasets,
  },
  loaders: [
    async () => ({
      todo: await (await fetch("https://jsonplaceholder.typicode.com/todos/1")).json(),
    }),
  ],
};
