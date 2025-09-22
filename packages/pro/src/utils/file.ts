import { Meta, UppyFile } from "@uppy/core";

import { Geodata } from "../components/Dashboard/Project/MergeData";
import { requiredCsvHeaders } from "../consts/file";

/**
 * Reads a file in chunks.
 * Parses the first row of a file and returns it as an array of strings.
 * Recursively jumping to the next chunk if the end of the first
 * line was not found after the previous chunks were read.
 * @param fileData
 * @param chunkSize
 * @returns promise that resolves to an array of string representing the header of a file.
 */
export const parseCsvRows = (data: Blob | File, chunkSize: number): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const size = data.size;
    let offset = 0;
    let result = "";
    const read = () => {
      const blob = data.slice(offset, offset + chunkSize); // slice the file by specifying the index(chunk size)
      const reader = new FileReader();
      reader.onload = (e: any) => {
        result += e.target.result;
        if (offset < size) {
          if (result.indexOf("\n") !== -1) {
            reader.abort();
            resolve(result.slice(0, result.indexOf("\n")).split(","));
          } else {
            read();
          }
        } else {
          if (result) {
            resolve(result.slice(0, result.indexOf("\n")).split(","));
          } else {
            reject("Could not read the rows in the file");
          }
        }
      };
      reader.readAsBinaryString(blob);
      offset += chunkSize; // increment the index position(chunk)
    };
    read();
  });
};

export const getGeodataType = async (
  file: UppyFile<Meta, Record<string, never>>,
): Promise<Geodata | undefined> => {
  const headers = await parseCsvRows(file.data, 2048);
  // replace all occurences of a new line or non alpha-numeric characters with an empty space
  const parsedCSVHeaders = headers.map((h) =>
    h.replace(/(?:[\r\n])|(?:[^a-z0-9]+)/gi, "").toLowerCase(),
  );
  if (parsedCSVHeaders.length === 0) {
    return;
  }

  let geodataType: Geodata | undefined;
  Object.keys(requiredCsvHeaders).forEach((h) => {
    const headerTyped = h as keyof typeof requiredCsvHeaders;
    const columnsGroup = requiredCsvHeaders[headerTyped];
    columnsGroup.forEach((columnGroup) => {
      if (geodataType === undefined) {
        const foundMatchedColumns = columnGroup.every((column) =>
          parsedCSVHeaders.includes(column),
        );
        if (foundMatchedColumns) {
          geodataType = headerTyped;
        }
      }
    });
  });

  return geodataType;
};
