const path = require("path");
const { getLoader, loaderByName } = require("@craco/craco");

const packages = [path.join(__dirname, "../components-lib"), path.join(__dirname, "../lib")];

module.exports = {
  webpack: {
    configure: (webpackConfig, arg) => {
      const { isFound, match } = getLoader(webpackConfig, loaderByName("babel-loader"));
      if (isFound) {
        const include = Array.isArray(match.loader.include)
          ? match.loader.include
          : [match.loader.include];

        match.loader.include = include.concat(packages);
      }
      webpackConfig.devtool = "source-map";
      return webpackConfig;
    },
  },
};
