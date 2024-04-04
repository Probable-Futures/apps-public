import { BrowserRouter } from "react-router-dom";
import type { Meta, StoryObj } from "@storybook/react";
import * as DocBlock from "@storybook/blocks";

import MapControls from "../components/MapControls";
import { datasets } from "./assets/mock-data/datasets.data";
import { TranslationLoader, TranslationProvider } from "../contexts/TranslationContext";
import AdditionalDocs from "./AdditionalDocs";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof MapControls> = {
  title: "PF/MapControls",
  component: MapControls,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="The actions you can perform on a map."
            whenAndHowToUse="Use it to add more actions to the map that the user can perform."
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
  decorators: [
    (Story) => (
      <BrowserRouter>
        <TranslationProvider>
          <TranslationLoader />
          <Story />
        </TranslationProvider>
      </BrowserRouter>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MapControls>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    zoom: 4,
    maxZoom: 9,
    selectedDataset: datasets[0],
    onZoom: () => {},
    onDownloadClick: () => {},
    onTakeScreenshot: () => {},
  },
};
