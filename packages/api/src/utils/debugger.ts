import Debug from "debug";

// Use this for unscoped debug statements
export const debug = Debug("pf_api");

// Use this to create custom scoped debug statements
// e.g. `pf_api:scope`
export const extendDebugger = (scope: string) => {
  return debug.extend(scope);
};
