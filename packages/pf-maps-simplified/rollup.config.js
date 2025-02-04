import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/pf-maps-simplified.umd.js",
      format: "umd",
      name: "PFMapsSimplified",
      sourcemap: true,
    },
    {
      file: "dist/pf-maps-simplified.iife.js",
      format: "iife",
      name: "PFMapsSimplified",
      sourcemap: true,
    },
  ],
  plugins: [
    resolve({ browser: true, preferBuiltins: false }), // Resolve dependencies
    commonjs(), // Convert CommonJS to ESM
    typescript({ tsconfig: "./tsconfig.json" }),
    terser(), // Minify output
  ],
};
