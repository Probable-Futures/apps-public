import type { Preview } from "@storybook/react";

import "../src/fonts.css";
import "../src/stories/assets/styles/globalStyles.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    toc: true,
  },
};

export default preview;
