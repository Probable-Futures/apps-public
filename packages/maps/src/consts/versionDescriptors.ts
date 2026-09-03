export const versionDescriptors: Record<number, string> = {
  1: "CORDEX",
  2: "CORDEX",
  3: "CORDEX",
  4: "stat. downscaled",
};

export const getVersionDescriptor = (mapVersion: number): string | undefined =>
  versionDescriptors[mapVersion];
