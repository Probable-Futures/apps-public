import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRef } from "react";
import { downloadFile, exportComponentAsPNG } from "../export";

vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,abc"),
}));

describe("downloadFile", () => {
  beforeEach(() => {
    // we're not really testing the browser's download behavior here, just that our function attempts to use it correctly
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  });

  it("creates an anchor, clicks it, and revokes the URL", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const blob = new Blob(["data"], { type: "text/plain" });

    downloadFile(blob, "test.txt");

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
  });
});

describe("exportComponentAsPNG", () => {
  it("returns early when ref.current is null", async () => {
    const { toPng } = await import("html-to-image");
    const ref = createRef<HTMLElement>();
    await exportComponentAsPNG(ref, "map.png");
    expect(toPng).not.toHaveBeenCalled();
  });

  it("calls toPng and triggers download when ref is set", async () => {
    const { toPng } = await import("html-to-image");
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const div = document.createElement("div");
    document.body.appendChild(div);
    const ref = { current: div } as React.RefObject<HTMLElement>;

    await exportComponentAsPNG(ref, "map.png");

    expect(toPng).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });
});
