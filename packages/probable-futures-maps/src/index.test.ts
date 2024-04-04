import path from "path";
import * as fs from "fs";
import { fail } from "assert";
import HTMLValidator from "html-validator";
import { describe, expect, it, jest } from "@jest/globals";

import { exportMapAsHTML } from "./exportMap";

jest.useFakeTimers();

describe("generate map module", () => {
  it("should generate html template, write it to file and validate html", async () => {
    const obj = {
      datasetId: 40103,
      viewState: {
        zoom: 5,
        longitude: 35.5018,
        latitude: 33.8938,
      },
      degrees: 2.5,
    };
    const htmlTemplate = await exportMapAsHTML(obj);
    const folderPath = `${path.join(__dirname, "..", "templates")}`;
    const fullPath = folderPath + "/output.html";

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    fs.writeFileSync(fullPath, htmlTemplate);

    const fileExists = fs.existsSync(fullPath);
    expect(fileExists).toBe(true);

    const htmlContent = fs.readFileSync(fullPath, "utf-8");

    try {
      await HTMLValidator({
        data: htmlContent,
      });
    } catch (error: any) {
      fail(`HTML validation failed: ${error.message}`);
    }
  });
});
