import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef } from "react";
import { downloadFile, exportComponentAsPNG } from "../export";

vi.mock("html-to-image", () => ({
  toCanvas: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

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
  const overlay = { width: 200, height: 100 };
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    drawImage: vi.fn(),
  };
  let clickSpy: ReturnType<typeof vi.spyOn>;

  const setRect = (el: HTMLElement, left: number, top: number, width: number, height: number) => {
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    });
  };

  // A 100x50 root, so the 200px wide overlay canvas implies a scale of 2.
  const renderRoot = () => {
    const root = document.createElement("div");
    setRect(root, 0, 0, 100, 50);
    document.body.appendChild(root);
    return root;
  };

  const addMapCanvas = (parent: HTMLElement, ...rect: [number, number, number, number]) => {
    const canvas = document.createElement("canvas");
    canvas.className = "mapboxgl-canvas";
    setRect(canvas, ...rect);
    parent.appendChild(canvas);
    return canvas;
  };

  const exportRoot = (root: HTMLElement) =>
    exportComponentAsPNG({ current: root } as React.RefObject<HTMLElement>, "map.png");

  beforeEach(async () => {
    const { toCanvas } = await import("html-to-image");
    vi.mocked(toCanvas)
      .mockReset()
      .mockResolvedValue(overlay as unknown as HTMLCanvasElement);
    Object.values(ctx).forEach((fn) => fn.mockClear());
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,out");
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("returns early when ref.current is null", async () => {
    const { toCanvas } = await import("html-to-image");
    const ref = createRef<HTMLElement>();
    await exportComponentAsPNG(ref, "map.png");
    expect(toCanvas).not.toHaveBeenCalled();
  });

  it("renders the overlay and triggers a download when ref is set", async () => {
    const { toCanvas } = await import("html-to-image");
    const root = renderRoot();

    await exportRoot(root);

    expect(toCanvas).toHaveBeenCalledWith(root, expect.objectContaining({ cacheBust: true }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("excludes map canvases from html-to-image and draws them directly", async () => {
    const { toCanvas } = await import("html-to-image");
    const root = renderRoot();
    const mapCanvas = addMapCanvas(root, 10, 5, 40, 20);
    const otherCanvas = document.createElement("canvas");
    root.appendChild(otherCanvas);

    await exportRoot(root);

    const { filter } = vi.mocked(toCanvas).mock.calls[0][1] as {
      filter: (n: HTMLElement) => boolean;
    };
    expect(filter(mapCanvas)).toBe(false);
    expect(filter(otherCanvas)).toBe(true);
    expect(filter(root)).toBe(true);

    expect(ctx.drawImage).toHaveBeenNthCalledWith(1, mapCanvas, 20, 10, 80, 40);
    expect(ctx.drawImage).toHaveBeenNthCalledWith(2, overlay, 0, 0);
    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
  });

  it("clips a map canvas to its ancestor's CSS clip rect", async () => {
    const root = renderRoot();
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.clip = "rect(0px, 60px, 50px, 0px)";
    setRect(container, 0, 0, 100, 50);
    root.appendChild(container);
    const mapCanvas = addMapCanvas(container, 0, 0, 100, 50);

    await exportRoot(root);

    expect(ctx.rect).toHaveBeenCalledWith(0, 0, 120, 100);
    expect(ctx.clip).toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenNthCalledWith(1, mapCanvas, 0, 0, 200, 100);
  });

  it("draws side-by-side comparison canvases each within its own clip", async () => {
    const root = renderRoot();
    const addClippedMap = (clip: string) => {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.clip = clip;
      setRect(container, 0, 0, 100, 50);
      root.appendChild(container);
      return addMapCanvas(container, 0, 0, 100, 50);
    };
    const before = addClippedMap("rect(0px, 60px, 50px, 0px)");
    const after = addClippedMap("rect(0px, 999em, 50px, 60px)");

    await exportRoot(root);

    expect(ctx.rect).toHaveBeenNthCalledWith(1, 0, 0, 120, 100);
    expect(ctx.rect).toHaveBeenNthCalledWith(2, 120, 0, 80, 100);
    expect(ctx.drawImage).toHaveBeenNthCalledWith(1, before, 0, 0, 200, 100);
    expect(ctx.drawImage).toHaveBeenNthCalledWith(2, after, 0, 0, 200, 100);
    expect(ctx.drawImage).toHaveBeenNthCalledWith(3, overlay, 0, 0);
  });

  it("clips a map canvas to an ancestor with hidden overflow", async () => {
    const root = renderRoot();
    const frame = document.createElement("div");
    // jsdom does not expand the `overflow` shorthand in computed styles.
    frame.style.overflowX = "hidden";
    frame.style.overflowY = "hidden";
    setRect(frame, 10, 5, 50, 30);
    root.appendChild(frame);
    const mapCanvas = addMapCanvas(frame, 0, 0, 100, 50);

    await exportRoot(root);

    expect(ctx.rect).toHaveBeenCalledWith(20, 10, 100, 60);
    expect(ctx.drawImage).toHaveBeenNthCalledWith(1, mapCanvas, 0, 0, 200, 100);
  });

  it("skips map canvases with no visible area", async () => {
    const root = renderRoot();
    addMapCanvas(root, 10, 5, 0, 0);

    await exportRoot(root);

    expect(ctx.clip).not.toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalledTimes(1);
    expect(ctx.drawImage).toHaveBeenCalledWith(overlay, 0, 0);
  });
});
