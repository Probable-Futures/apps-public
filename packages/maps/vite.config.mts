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
      // Re-import the real package; resolveId will skip because importer starts with CJS_INTEROP_PREFIX
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
  return {
    name: "svg-react-component",
    enforce: "pre",
    async load(id: string) {
      // Strip query params (e.g. ?import, ?used) but skip ?url (handled by Vite)
      const cleanId = id.replace(/\?.*$/, "");
      if (!cleanId.endsWith(".svg") || id.includes("?url")) return null;

      const svgCode = await fs.promises.readFile(cleanId, "utf8");
      const componentCode = await svgrTransform(svgCode, {
        exportType: "named",
        jsxRuntime: "automatic",
        plugins: [svgrPluginJsx],
      });

      // Combine the named ReactComponent export with a default URL export.
      // The `?url` suffix tells Vite to return the asset URL.
      const jsxCode = [
        componentCode,
        `import __svgUrl from "${cleanId}?url";`,
        `export default __svgUrl;`,
      ].join("\n");

      // Transform JSX to JS since .svg files aren't recognized as JSX
      const result = await transformWithOxc(jsxCode, id, { lang: "jsx" });
      return { code: result.code, map: null };
    },
  };
}

/**
 * Generates a CRA-compatible asset-manifest.json so the WordPress plugin
 * can discover and enqueue the built JS/CSS files via `entrypoints`.
 */
function assetManifestPlugin(): Plugin {
  return {
    name: "asset-manifest",
    apply: "build",
    enforce: "post",
    writeBundle(options: any, bundle: Record<string, any>) {
      const outDir = options.dir || path.resolve(import.meta.dirname, "build");
      const base = (this as any).environment?.config?.base ?? "/";

      const files: Record<string, string> = {};
      const entrypoints: string[] = [];

      for (const [fileName, chunk] of Object.entries(bundle)) {
        const assetPath = base + fileName;

        if (chunk.type === "chunk") {
          if ((chunk as any).isEntry) {
            files["main.js"] = assetPath;
            entrypoints.push(fileName);
          } else {
            files[fileName] = assetPath;
          }
        } else {
          // asset (css, images, etc.)
          if (fileName.endsWith(".css")) {
            files["main.css"] = assetPath;
            // CSS entrypoints come before JS
            entrypoints.unshift(fileName);
          } else {
            files[fileName] = assetPath;
          }
        }
      }

      const manifest = { files, entrypoints };
      fs.writeFileSync(path.join(outDir, "asset-manifest.json"), JSON.stringify(manifest, null, 2));
    },
  };
}

export default defineConfig({
  plugins: [cjsInteropPlugin(), react(), svgPlugin(), assetManifestPlugin()],
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
