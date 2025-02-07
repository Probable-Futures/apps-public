import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/probable-futures-maps-html-generator.umd.js",
      format: "umd",
      name: "ProbableFuturesMapsHTMLGenerator",
      sourcemap: true,
    },
    {
      file: "dist/probable-futures-maps-html-generator.iife.js",
      format: "iife",
      name: "ProbableFuturesMapsHTMLGenerator",
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
