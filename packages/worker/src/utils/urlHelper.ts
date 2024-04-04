import { URL } from "url";

type File = {
  name: string;
  path: string;
};

/**
 * Retrieves file name and file path from the given string url
 * @param file
 */
export const extractNameAndPath = (file: string): File => {
  // FIXME: Remove fallback to empty string and throw error
  let path = new URL(file).pathname || ""; // `/local-development/${original_file_name}`
  path = path.replace(/^\/|\/$/g, ""); // replace leading slashes or trailing slashes with empty string
  path = decodeURIComponent(path);

  const name = path.split("/").pop() || "";

  return { name, path };
};
