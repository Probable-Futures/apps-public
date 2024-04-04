import type { StorybookConfig } from "@storybook/react-webpack5";
const { getLoader, loaderByName } = require("@craco/craco");

import path, { join, dirname, resolve } from "path";

const packages = [
  path.join(__dirname, "../components-lib"),
  path.join(__dirname, "../lib"),
  path.join(__dirname, "../probable-futures-maps"),
];

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/preset-create-react-app"),
    getAbsolutePath("@storybook/addon-onboarding"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-webpack5"),
    options: {
      builder: {
        useSWC: true,
      },
    },
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["../public"],
  webpackFinal: (config, { configType }) => {
    // Find the Babel loader in the webpack configuration
    const { isFound, match } = getLoader(config, loaderByName("babel-loader"));

    // If the Babel loader is found, update its include option
    if (isFound) {
      const include = Array.isArray(match.loader.include)
        ? match.loader.include
        : [match.loader.include];

      // Add your local packages to the include array
      match.loader.include = include.concat(packages);
    }

    config?.module?.rules?.push(
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                [
                  "@babel/preset-react",
                  {
                    runtime: "automatic",
                  },
                ],
                "@babel/preset-typescript",
              ],
            },
          },
        ],
      },
      // Add other rules as needed...
    );

    // Return the updated webpack configuration
    return config;
  },
};
export default config;
