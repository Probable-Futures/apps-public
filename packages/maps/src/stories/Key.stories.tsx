import styled from "styled-components";
import type { Meta, StoryObj } from "@storybook/react";
import * as DocBlock from "@storybook/blocks";

import { consts } from "@probable-futures/lib";
import { datasets } from "./assets/mock-data/datasets.data";
import { components } from "@probable-futures/components-lib";
import { colors, customTabletSizeForHeader, size } from "@probable-futures/lib/src/consts";
import AdditionalDocs from "./AdditionalDocs";

const MapKeyContainer = styled.div`
  position: absolute;
  top: ${consts.HEADER_HEIGHT};
  right: 0;
  left: 0;
  z-index: 1;
  min-width: 280px;

  @media (min-width: ${customTabletSizeForHeader}) {
    top: 0;
    z-index: 2;
    right: unset;
    ${({ datasetDropdownWidth }: { datasetDropdownWidth?: number }) =>
      ` width: ${datasetDropdownWidth ? `calc(100% - ${datasetDropdownWidth + 10}px)` : "auto"};
        left: ${datasetDropdownWidth ? `${datasetDropdownWidth + 10}px` : "371px"};
    `};
  }

  @media (min-width: ${size.laptop}) {
    top: unset;
    right: unset;
    left: 55px;
    bottom: 36px;
    z-index: 2;
    width: auto;
  }

  .map-key-container {
    border-top: 1px solid ${colors.darkPurple};

    @media (min-width: ${customTabletSizeForHeader}) {
      padding: 9px 0 0;
      border-bottom: none;
      border-top: none;
    }

    @media (min-width: ${size.laptop}) {
      border: 1px solid ${colors.darkPurple};
      padding: 12px 18px 9px;
    }
  }
`;

const meta: Meta<typeof components.MapKey> = {
  title: "PF/MapKey",
  component: components.MapKey,
  parameters: {
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="The legend of each map explains the colors and bins displayed by the map."
            whenAndHowToUse="It is used at the bottom left of each map. Each map has its own interpretation of the colors and bins displayed on the map."
            currentUsage="Maps page"
          />
          <DocBlock.Heading>Props</DocBlock.Heading>
          <DocBlock.Controls />
        </>
      ),
    },
  },
  argTypes: {},
  decorators: [
    (Story) => (
      <MapKeyContainer>
        <Story />
      </MapKeyContainer>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof components.MapKey>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    selectedDataset: datasets[18],
    tempUnit: "°C",
    setTempUnit: () => {},
    precipitationUnit: "mm",
    setPrecipitationUnit: () => {},
  },
};
