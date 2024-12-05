import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import rollupJson from "@rollup/plugin-json";
import packageJson from "./package.json" assert { type: "json" };
import svgr from "@svgr/rollup";
import alias from "@rollup/plugin-alias";
import url from "@rollup/plugin-url";
import nodeResolve from "@rollup/plugin-node-resolve";

const conf = {
  input: "src/index.ts",
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    nodeResolve({
      browser: true, // Ensure browser-compatible versions of modules are used
    }),
    peerDepsExternal(),
    resolve({ extensions: [".js", ".jsx", ".ts", ".tsx"] }),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfig: "./tsconfig.json",
      clean: true,
    }),
    postcss(),
    rollupJson(),
    url({
      include: ["**/*.svg"], // Handle SVG files as raw URLs
      limit: 0, // Disable file size limit (or adjust as needed)
      emitFiles: true,
    }),
    svgr({ exportType: "named", jsxRuntime: "classic", include: "**/*.svg" }),
  ],
  external: [
    ...Object.keys(packageJson.peerDependencies || {}),
    ...Object.keys(packageJson.dependencies || {}),
    "@probable-futures/lib",
  ],
};

export default conf;
