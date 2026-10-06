/// <reference types="vitest" />
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
 *
 * `entrypoints` matches what Vite links from index.html: the entry chunk plus the
 * CSS of the entry and its static imports. The entry loads every other chunk at
 * runtime, and Vite injects the CSS of dynamically imported chunks itself.
 */
function assetManifestPlugin(): Plugin {
  return {
    name: "asset-manifest",
    apply: "build",
    enforce: "post",
    writeBundle(options: any, bundle: Record<string, any>) {
      const outDir = options.dir || path.resolve(import.meta.dirname, "build");
      const base = (this as any).environment?.config?.base ?? "/";

      const entry = Object.values(bundle).find((chunk) => chunk.type === "chunk" && chunk.isEntry);
      const entryCss = new Set<string>();
      const visited = new Set<string>();
      // Same order as index.html: CSS of static imports before the importing chunk's own.
      const collectCss = (chunk: any) => {
        if (visited.has(chunk.fileName)) return;
        visited.add(chunk.fileName);
        for (const file of chunk.imports) {
          if (bundle[file]?.type === "chunk") collectCss(bundle[file]);
        }
        chunk.viteMetadata.importedCss.forEach((file: string) => entryCss.add(file));
      };
      collectCss(entry);

      const ownCss = new Set<string>(entry.viteMetadata.importedCss);
      const files: Record<string, string> = {};
      for (const fileName of Object.keys(bundle)) {
        if (fileName === entry.fileName) {
          files["main.js"] = base + fileName;
        } else if (ownCss.has(fileName)) {
          files["main.css"] = base + fileName;
        } else {
          files[fileName] = base + fileName;
        }
      }

      // CSS entrypoints come before JS
      const manifest = { files, entrypoints: [...entryCss, entry.fileName] };
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
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/setupTests.ts"],
    css: false,
    // The workspace packages publish from dist/, which is not built when running
    // tests, so resolve their bare specifiers to source instead.
    alias: [
      {
        find: /^@probable-futures\/lib$/,
        replacement: path.resolve(import.meta.dirname, "../lib/index.ts"),
      },
      {
        find: /^@probable-futures\/components-lib$/,
        replacement: path.resolve(import.meta.dirname, "../components-lib/src/index.ts"),
      },
    ],
  },
  build: {
    outDir: "build",
    rollupOptions: {
      output: {
        // ES modules so dynamic imports (e.g. each locale) become separate chunks. The WP
        // plugin loads the entry with type="module".
        format: "es",
        // CRA-style naming convention
        entryFileNames: "static/js/[name].[hash].js",
        chunkFileNames: "static/js/[name].[hash].js",
        assetFileNames: "static/[ext]/[name].[hash][extname]",
      },
    },
  },
});
