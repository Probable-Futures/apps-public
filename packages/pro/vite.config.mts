import { defineConfig, transformWithOxc, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { transform as svgrTransform } from "@svgr/core";
import svgrPluginJsx from "@svgr/plugin-jsx";
import fs from "node:fs";
import path from "node:path";

/**
 * Workaround for Vite 8 not applying CJS interop to imports inside files
 * served from /@fs/ (outside project root). Uses a virtual module to
 * re-export with proper __esModule default unwrapping.
 */
const CJS_INTEROP_PACKAGES = ["react-headroom"];
const CJS_INTEROP_PREFIX = "\0cjs-interop:";

function cjsInteropPlugin(): Plugin {
  return {
    name: "cjs-interop-fix",
    enforce: "pre",
    resolveId(source: string, importer: string | undefined) {
      if (
        CJS_INTEROP_PACKAGES.includes(source) &&
        importer &&
        !importer.startsWith(CJS_INTEROP_PREFIX)
      ) {
        return CJS_INTEROP_PREFIX + source;
      }
    },
    load(id: string) {
      if (!id.startsWith(CJS_INTEROP_PREFIX)) return null;
      const pkg = id.slice(CJS_INTEROP_PREFIX.length);
      return `import __mod from "${pkg}";\nexport default __mod?.__esModule ? __mod.default : __mod;\n`;
    },
  };
}

/**
 * Custom SVG plugin that provides CRA-compatible imports:
 * - `import { ReactComponent as X } from "./icon.svg"` (inline React component)
 * - `import iconUrl from "./icon.svg"` (asset URL string)
 */
function svgPlugin(): Plugin {
  let isDev = true;
  let rootDir = "";

  return {
    name: "svg-react-component",
    enforce: "pre",
    configResolved(config) {
      isDev = config.command === "serve";
      rootDir = config.root;
    },
    async load(id: string) {
      const cleanId = id.replace(/\?.*$/, "");
      if (!cleanId.endsWith(".svg") || id.includes("?url")) return null;

      const svgCode = await fs.promises.readFile(cleanId, "utf8");
      const componentCode = await svgrTransform(svgCode, {
        exportType: "named",
        jsxRuntime: "automatic",
        plugins: [svgrPluginJsx],
      });

      let urlExport: string;
      if (isDev) {
        // In dev, use the file path relative to root. Avoids data-URI inlining
        // which can contain unescaped quotes that break CSS url().
        const relPath = "/" + path.relative(rootDir, cleanId).split(path.sep).join("/");
        urlExport = `export default ${JSON.stringify(relPath)};`;
      } else {
        // In build, emit as an asset so Vite hashes and bundles the file.
        const referenceId = this.emitFile({
          type: "asset",
          name: path.basename(cleanId),
          source: svgCode,
        });
        urlExport = `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
      }

      const jsxCode = [componentCode, urlExport].join("\n");
      const result = await transformWithOxc(jsxCode, id, { lang: "jsx" });
      return { code: result.code, map: null };
    },
  };
}

export default defineConfig({
  plugins: [react(), cjsInteropPlugin(), svgPlugin()],
  resolve: {
    alias: {
      src: path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: ["local.probablefutures.org"],
    hmr: {
      protocol: "wss",
      host: "local.probablefutures.org",
      clientPort: 443,
    },
  },
  build: {
    outDir: "build",
  },
});
