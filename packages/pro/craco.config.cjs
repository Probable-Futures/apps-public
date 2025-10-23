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
      const fastMemoizePathRegex = /node_modules[\\\/]@formatjs[\\\/]fast-memoize[\\\/]/;

      const addExcludeToSourceMapLoader = (rules) => {
        if (!rules) return;
        const visit = (rule) => {
          if (!rule) return;
          const maybeAddExclude = (r) => {
            const uses = Array.isArray(r.use) ? r.use : r.use ? [r.use] : [];
            const hasSourceMapLoader =
              (r.loader &&
                typeof r.loader === "string" &&
                r.loader.includes("source-map-loader")) ||
              uses.some((u) => {
                const loaderName = typeof u === "string" ? u : u && u.loader;
                return typeof loaderName === "string" && loaderName.includes("source-map-loader");
              });
            if (hasSourceMapLoader) {
              if (Array.isArray(r.exclude)) {
                r.exclude.push(fastMemoizePathRegex);
              } else if (r.exclude) {
                r.exclude = [r.exclude, fastMemoizePathRegex];
              } else {
                r.exclude = fastMemoizePathRegex;
              }
            }
          };

          maybeAddExclude(rule);

          if (Array.isArray(rule.oneOf)) {
            rule.oneOf.forEach(visit);
          }
          if (Array.isArray(rule.rules)) {
            rule.rules.forEach(visit);
          }
        };

        if (Array.isArray(rules)) {
          rules.forEach(visit);
        } else {
          visit(rules);
        }
      };

      addExcludeToSourceMapLoader(webpackConfig.module && webpackConfig.module.rules);

      // Ensure .cjs files in node_modules are treated as JavaScript, not assets
      const ensureCjsRule = (config) => {
        const cjsRule = {
          test: /\.cjs$/,
          include: /node_modules/,
          type: "javascript/auto",
        };

        if (config && config.module) {
          const rules = config.module.rules || [];
          const oneOfContainer = rules.find((r) => Array.isArray(r.oneOf));
          if (oneOfContainer && Array.isArray(oneOfContainer.oneOf)) {
            oneOfContainer.oneOf.unshift(cjsRule);
          } else if (Array.isArray(rules)) {
            rules.unshift(cjsRule);
          }
        }
      };

      ensureCjsRule(webpackConfig);

      webpackConfig.ignoreWarnings = webpackConfig.ignoreWarnings || [];
      webpackConfig.ignoreWarnings.push((warning) => {
        const message = typeof warning === "string" ? warning : warning && warning.message;
        const resource = warning && warning.module && warning.module.resource;
        return (
          /Failed to parse source map/.test(message || "") &&
          typeof resource === "string" &&
          fastMemoizePathRegex.test(resource)
        );
      });

      return webpackConfig;
    },
  },
};
