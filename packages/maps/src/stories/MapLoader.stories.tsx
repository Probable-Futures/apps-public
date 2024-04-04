import type { Meta, StoryObj } from "@storybook/react";
import * as DocBlock from "@storybook/blocks";
import styled from "styled-components";

import { components } from "@probable-futures/components-lib";
import AdditionalDocs from "./AdditionalDocs";

const Wrapper = styled.div`
  position: absolute;
  left: 0;
  width: 100%;
`;

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof components.Loader> = {
  title: "PF/MapLoader",
  component: components.Loader,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="The loader indicating the loading state of the map styles and tilesets."
            whenAndHowToUse="The loader can be displayed on top of the map to indicate that the map is still loading or some events are still running on the page."
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
      <Wrapper>
        <Story />
      </Wrapper>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof components.Loader>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    show: true,
  },
};
