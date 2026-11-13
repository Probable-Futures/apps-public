import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRef } from "react";
import { createContext, destroyContext, domToCanvas } from "modern-screenshot";
import { downloadFile, exportComponentAsPNG, preloadScreenshot } from "../export";

vi.mock("modern-screenshot", () => ({
  createContext: vi.fn(),
  destroyContext: vi.fn(),
  domToCanvas: vi.fn(),
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

  // The options the most recent context was created with.
  const contextOptions = () =>
    vi.mocked(createContext).mock.calls.at(-1)?.[1] as {
      filter: (node: Node) => boolean;
      fetchFn: (url: string) => Promise<string | false>;
      onCloneEachNode: (cloned: Node) => void;
      features: Record<string, boolean>;
      autoDestruct: boolean;
    };

  beforeEach(() => {
    vi.mocked(createContext)
      .mockReset()
      .mockImplementation(async (node) => ({ node } as never));
    vi.mocked(destroyContext).mockReset();
    vi.mocked(domToCanvas)
      .mockReset()
      .mockResolvedValue(overlay as unknown as HTMLCanvasElement);
    Object.values(ctx).forEach((fn) => fn.mockClear());
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,out");
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("preloads the library without capturing anything", async () => {
    expect(() => preloadScreenshot()).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(createContext).not.toHaveBeenCalled();
    expect(domToCanvas).not.toHaveBeenCalled();
  });

  it("returns early when ref.current is null", async () => {
    const ref = createRef<HTMLElement>();
    await exportComponentAsPNG(ref, "map.png");
    expect(domToCanvas).not.toHaveBeenCalled();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it("renders the overlay at the root's size and pixel ratio and triggers a download", async () => {
    vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(2);
    const root = renderRoot();

    await exportRoot(root);

    expect(createContext).toHaveBeenCalledWith(
      root,
      expect.objectContaining({ autoDestruct: false }),
    );
    expect(domToCanvas).toHaveBeenCalledWith(
      expect.objectContaining({ node: root, width: 100, height: 50, scale: 2 }),
    );
    expect(clickSpy).toHaveBeenCalled();
  });

  describe("redrawing", () => {
    const styled = (style: Partial<CSSStyleDeclaration>, src?: string) => {
      const el = document.createElement(src ? "img" : "div");
      Object.assign(el.style, style);
      if (src) {
        el.setAttribute("src", src);
      }
      return el;
    };
    const text = styled({ fontFamily: "LinearSans", fontWeight: "400" });
    const boldText = styled({ fontFamily: "LinearSans", fontWeight: "700" });
    const logo = styled({ backgroundImage: 'url("logo.svg")' });
    const arrow = styled({ backgroundImage: 'url("arrow.svg")' });
    const photo = styled({}, "photo.png");

    // Each capture passes these clones through the cloning hook and records whether it redraws.
    let clones: Node[] = [];
    let redrawn: boolean[] = [];
    beforeEach(() => {
      clones = [];
      redrawn = [];
      vi.mocked(domToCanvas).mockImplementation(async () => {
        const { onCloneEachNode, features } = contextOptions();
        clones.forEach(onCloneEachNode);
        redrawn.push(features.fixSvgXmlDecode);
        return overlay as unknown as HTMLCanvasElement;
      });
    });

    const captureWith = async (root: HTMLElement, ...nodes: Node[]) => {
      clones = [root, ...nodes];
      await exportRoot(root);
    };

    it("redraws only captures that draw a font or image no earlier capture drew", async () => {
      const root = renderRoot();

      await captureWith(root, text, logo, document.createTextNode("text"));
      await captureWith(root, text, logo);
      await captureWith(root, text, logo, arrow);
      await captureWith(root, text, logo, arrow);
      await captureWith(root, text, boldText, logo);
      await captureWith(root, text, logo, photo);
      await captureWith(root, text, boldText, logo, arrow, photo);

      expect(redrawn).toEqual([true, false, true, false, true, true, false]);
    });

    it("redraws again after a failed capture", async () => {
      vi.mocked(domToCanvas).mockImplementationOnce(async () => {
        clones.forEach(contextOptions().onCloneEachNode);
        redrawn.push(contextOptions().features.fixSvgXmlDecode);
        throw new Error("decode failed");
      });
      const root = renderRoot();

      await expect(captureWith(root, text, logo)).rejects.toThrow("decode failed");
      await captureWith(root, text, logo);

      expect(redrawn).toEqual([true, true]);
    });

    it("redraws again with a new root", async () => {
      await captureWith(renderRoot(), text, logo);
      await captureWith(renderRoot(), text, logo);

      expect(redrawn).toEqual([true, true]);
    });

    it("limits the redraws to three, 50 ms apart", async () => {
      const root = renderRoot();
      await captureWith(root, text);
      const context = (await vi.mocked(createContext).mock.results.at(-1)?.value) as {
        drawImageCount: number;
      };
      const { onCreateForeignObjectSvg, drawImageInterval } = contextOptions() as unknown as {
        onCreateForeignObjectSvg: () => void;
        drawImageInterval: number;
      };

      const counts = [12, 3, 1, 0].map((count) => {
        context.drawImageCount = count;
        onCreateForeignObjectSvg();
        return context.drawImageCount;
      });

      expect(counts).toEqual([3, 3, 1, 0]);
      expect(drawImageInterval).toBe(50);
    });

    it("doesn't copy scrollbar styles", async () => {
      await captureWith(renderRoot(), text);

      expect(contextOptions().features.copyScrollbar).toBe(false);
    });
  });

  it("reuses the context for the same root and refreshes its size", async () => {
    const root = renderRoot();
    await exportRoot(root);
    vi.mocked(createContext).mockClear();
    vi.mocked(destroyContext).mockClear();
    setRect(root, 0, 0, 120, 60);

    await exportRoot(root);

    expect(createContext).not.toHaveBeenCalled();
    expect(destroyContext).not.toHaveBeenCalled();
    expect(domToCanvas).toHaveBeenLastCalledWith(
      expect.objectContaining({ node: root, width: 120, height: 60 }),
    );
  });

  it("replaces the context when the root changes", async () => {
    await exportRoot(renderRoot());
    const previous = await vi.mocked(createContext).mock.results.at(-1)?.value;
    const root = renderRoot();

    await exportRoot(root);

    expect(destroyContext).toHaveBeenCalledWith(previous);
    expect(createContext).toHaveBeenLastCalledWith(root, expect.anything());
  });

  it("leaves fragment references in data URIs alone instead of fetching them", async () => {
    await exportRoot(renderRoot());

    const { fetchFn } = contextOptions();
    await expect(fetchFn("https://probablefutures.org/maps/%23clip")).resolves.toBe("%23clip");
    await expect(fetchFn("https://probablefutures.org/maps/logo.svg")).resolves.toBe(false);
    await expect(fetchFn("https://probablefutures.org/img/%23logo.png")).resolves.toBe(false);
  });

  it("draws scroll containers without scrollbars", async () => {
    await exportRoot(renderRoot());
    const { onCloneEachNode } = contextOptions();
    const scrolling = document.createElement("div");
    scrolling.style.overflowX = "auto";
    scrolling.style.overflowY = "scroll";
    const clipped = document.createElement("div");
    clipped.style.overflowX = "visible";
    clipped.style.overflowY = "hidden";

    onCloneEachNode(scrolling);
    onCloneEachNode(clipped);
    onCloneEachNode(document.createTextNode("text"));

    expect([scrolling.style.overflowX, scrolling.style.overflowY]).toEqual(["hidden", "hidden"]);
    expect([clipped.style.overflowX, clipped.style.overflowY]).toEqual(["visible", "hidden"]);
  });

  it("runs one capture at a time", async () => {
    let finishFirst: (canvas: HTMLCanvasElement) => void = () => {};
    vi.mocked(domToCanvas).mockImplementationOnce(
      () => new Promise((resolve) => (finishFirst = resolve)),
    );
    const root = renderRoot();

    const first = exportRoot(root);
    const second = exportRoot(root);
    await vi.waitFor(() => expect(domToCanvas).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(domToCanvas).toHaveBeenCalledTimes(1);

    finishFirst(overlay as unknown as HTMLCanvasElement);
    await Promise.all([first, second]);
    expect(domToCanvas).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it("keeps capturing after a failed capture", async () => {
    vi.mocked(domToCanvas).mockRejectedValueOnce(new Error("decode failed"));
    const root = renderRoot();

    await expect(exportRoot(root)).rejects.toThrow("decode failed");
    await exportRoot(root);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("excludes map canvases from modern-screenshot and draws them directly", async () => {
    const root = renderRoot();
    const mapCanvas = addMapCanvas(root, 10, 5, 40, 20);
    const otherCanvas = document.createElement("canvas");
    root.appendChild(otherCanvas);

    await exportRoot(root);

    const { filter } = contextOptions();
    expect(filter(mapCanvas)).toBe(false);
    expect(filter(otherCanvas)).toBe(true);
    expect(filter(root)).toBe(true);

    expect(ctx.drawImage).toHaveBeenNthCalledWith(1, mapCanvas, 20, 10, 80, 40);
    expect(ctx.drawImage).toHaveBeenNthCalledWith(2, overlay, 0, 0);
    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
  });

  it("scales map canvases to the width the overlay was rendered at", async () => {
    const root = renderRoot();
    const mapCanvas = addMapCanvas(root, 10, 5, 40, 20);
    vi.mocked(domToCanvas).mockImplementationOnce(async () => {
      setRect(root, 0, 0, 50, 25);
      return overlay as unknown as HTMLCanvasElement;
    });

    await exportRoot(root);

    expect(ctx.drawImage).toHaveBeenNthCalledWith(1, mapCanvas, 20, 10, 80, 40);
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
