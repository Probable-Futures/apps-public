import type { Meta, StoryObj } from "@storybook/react";
import * as DocBlock from "@storybook/blocks";

import { components } from "@probable-futures/components-lib";
import { consts } from "@probable-futures/lib";
import AdditionalDocs from "./AdditionalDocs";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof components.Geocoder> = {
  title: "PF/Search",
  component: components.Geocoder,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="The search box for searching the maps for a specific location."
            whenAndHowToUse="It is used as part of the map controls to allow users to seach the map for locations."
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
type Story = StoryObj<typeof components.Geocoder>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    searchInputHeight: "35px",
    serverErrorText: "There was an error reaching the server",
    noResultText: "No results found",
    placeholderText: "Search for a location",
    clearText: "clear",
    recentlySearchedText: "recently searched",
    localStorageRecentlySearchedIemskey: consts.LOCAL_STORAGE_RECENTLY_SEARCHED_ITEMS_KEY,
    mapRef: undefined,
    mapboxAccessToken: undefined,
    onFly: undefined,
    top: "200px",
  },
};
