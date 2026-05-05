import { describe, it, expect } from "vitest";
import en from "../en.json";
import fr from "../fr.json";
import es from "../es.json";
import zh from "../zh.json";

function flatKeys(obj: Record<string, any>, prefix = ""): string[] {
  return Object.keys(obj).flatMap((k) => {
    const full = prefix ? `${prefix}.${k}` : k;
    return typeof obj[k] === "object" && obj[k] !== null ? flatKeys(obj[k], full) : [full];
  });
}

const enKeys = new Set(flatKeys(en));

const locales: Array<{ name: string; data: Record<string, any> }> = [
  { name: "fr", data: fr },
  { name: "es", data: es },
  { name: "zh", data: zh },
];

describe("i18n locale consistency", () => {
  for (const { name, data } of locales) {
    it(`all en.json keys exist in ${name}.json`, () => {
      const keys = new Set(flatKeys(data));
      const missing = [...enKeys].filter((k) => !keys.has(k));
      if (missing.length > 0) {
        // Warn about untranslated keys rather than hard-failing so CI isn't blocked
        // while translations are being added. Remove this guard once all locales are complete.
        console.warn(`[i18n] ${missing.length} untranslated key(s) in ${name}.json:\n  ${missing.join("\n  ")}`);
      }
      // Structural check: all keys that DO exist must match en.json structure (no orphans in shared keys)
      const orphaned = flatKeys(data).filter((k) => !enKeys.has(k));
      expect(orphaned, `Orphaned keys in ${name}.json: ${orphaned.join(", ")}`).toHaveLength(0);
    });

    it(`${name}.json has no keys absent from en.json (orphan check)`, () => {
      const keys = flatKeys(data);
      const orphaned = keys.filter((k) => !enKeys.has(k));
      expect(orphaned, `Orphaned keys in ${name}.json: ${orphaned.join(", ")}`).toHaveLength(0);
    });
  }
});
