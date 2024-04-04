import type { Meta, StoryObj } from "@storybook/react";
import styled from "styled-components";
import { useArgs } from "@storybook/client-api";
import * as DocBlock from "@storybook/blocks";

import { HEADER_HEIGHT, colors, size } from "@probable-futures/lib/src/consts";
import { components } from "@probable-futures/components-lib";
import AdditionalDocs from "./AdditionalDocs";

type ContainerProps = {
  moreIsOpen: boolean;
};

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: ${HEADER_HEIGHT};
  box-sizing: content-box;
  z-index: ${({ moreIsOpen }: ContainerProps) => (moreIsOpen ? 2 : 5)};

  @media (min-width: ${size.tablet}), (orientation: landscape) {
    border-bottom: 1px solid ${colors.darkPurple};
    z-index: 2;
  }

  @media (min-width: ${size.laptop}) {
    z-index: 3;
  }
`;

const Content = styled.div`
  height: 60px;
  display: flex;
  align-items: center;
  flex: 1;

  @media (min-width: ${size.tablet}) {
    max-width: 1540px;
    margin: 0 auto;
  }

  @media (min-width: ${size.laptop}) {
    height: ${HEADER_HEIGHT};
  }
`;

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof components.Degrees> = {
  title: "PF/DegreesSelector",
  component: components.Degrees,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
    docs: {
      page: () => (
        <>
          <DocBlock.Title />
          <AdditionalDocs
            whatIsIt="Waraming scenario buttons that represent different degrees of warming."
            whenAndHowToUse="It is used as part of the header to switch between different warming scenarios."
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
  argTypes: {},
  decorators: [
    (Story) => (
      <Container moreIsOpen={false}>
        <Content>
          <Story />
        </Content>
      </Container>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof components.Degrees>;

export const Primary: Story = (args: any) => {
  const [, updateArgs] = useArgs();
  const handleWarmingScenarioClick = (newDegree: number) => {
    updateArgs({ degrees: newDegree });
  };

  return <components.Degrees {...args} onWarmingScenarioClick={handleWarmingScenarioClick} />;
};

Primary.args = {
  degrees: 1,
  warmingScenarioDescs: {},
  showDegreeDescription: false,
  showBaselineModal: false,
  tourProps: undefined,
  onWarmingScenarioDescriptionCancel: undefined,
  onWarmingScenarioClick: undefined,
  headerText: undefined,
};
