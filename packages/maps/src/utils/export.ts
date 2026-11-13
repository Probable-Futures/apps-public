import { RefObject } from "react";
import type { Context } from "modern-screenshot";

type Rect = { left: number; top: number; right: number; bottom: number };

type ModernScreenshot = typeof import("modern-screenshot");

const saveAs = (uri: string, filename: string) => {
  const link = document.createElement("a");

  if (typeof link.download === "string") {
    link.href = uri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    window.open(uri);
  }
};

const isMapCanvas = (node: Node): node is HTMLCanvasElement =>
  node instanceof HTMLCanvasElement && node.classList.contains("mapboxgl-canvas");

// The Mapbox logo is an SVG data URI containing `url(%23clip)`, which modern-screenshot takes for an
// image to fetch. A fragment only points inside that SVG, so it is handed back unchanged instead of
// requesting a URL that 404s.
const keepFragmentReference = async (url: string): Promise<string | false> => {
  const lastSegment = url.slice(url.lastIndexOf("/") + 1);
  return /^%23[\w-]+$/.test(lastSegment) ? lastSegment : false;
};

// Inside the rendered SVG a scroll container can get a scrollbar the page doesn't show (macOS
// scrollbars are overlays), which narrows it and clips content laid out at the page's width, such
// as the dataset selector's button at tablet width. Screenshots show no scrollbars, so scroll
// containers clip their content instead.
const hideScrollbar = (cloned: Node) => {
  const { style } = cloned as HTMLElement;
  if (!style) {
    return;
  }
  for (const axis of ["overflowX", "overflowY"] as const) {
    if (style[axis] === "scroll" || style[axis] === "auto") {
      style[axis] = "hidden";
    }
  }
};

let overlayContext: Context<HTMLElement> | null = null;

// modern-screenshot keeps this object and reads it on every capture. Scrollbar styles are not copied
// because scroll containers are drawn without scrollbars.
const overlayFeatures = { fixSvgXmlDecode: true, copyScrollbar: false };

// Safari can draw the rendered SVG before the fonts and images embedded in it have loaded, which
// drops the Mapbox logo and falls back to a system font. modern-screenshot redraws the SVG to fix that
// (in Safari and Firefox), which takes time, so a capture only redraws when it contains a background
// image, image or font that no earlier capture with the context has drawn.
let drawnResources = new Set<string>();
let newResources = new Set<string>();

const recordResources = (cloned: Node) => {
  const element = cloned as HTMLElement;
  if (!element.style) {
    return;
  }
  const { backgroundImage, fontFamily, fontWeight, fontStyle } = element.style;
  const resources = [
    backgroundImage && backgroundImage !== "none" ? backgroundImage : null,
    element.getAttribute("src"),
    fontFamily ? `${fontFamily} ${fontWeight} ${fontStyle}` : null,
  ];
  for (const resource of resources) {
    if (resource && !drawnResources.has(resource)) {
      newResources.add(resource);
      overlayFeatures.fixSvgXmlDecode = true;
    }
  }
};

const MAX_REDRAWS = 3;

// Runs after the images are embedded and counted, before the SVG is drawn.
const limitRedraws = () => {
  if (overlayContext) {
    overlayContext.drawImageCount = Math.min(overlayContext.drawImageCount, MAX_REDRAWS);
  }
};

// One context is kept for the current root so its embedded fonts and default styles carry over to
// the next screenshot. A context records the root's size and the pixel ratio when it is created, so
// both are refreshed before every capture.
const getOverlayContext = async (
  { createContext, destroyContext }: ModernScreenshot,
  node: HTMLElement,
) => {
  if (overlayContext?.node !== node) {
    if (overlayContext) {
      destroyContext(overlayContext);
    }
    drawnResources = new Set();
    overlayContext = await createContext(node, {
      filter: (el) => !isMapCanvas(el),
      fetchFn: keepFragmentReference,
      onCloneEachNode: (cloned) => {
        hideScrollbar(cloned);
        recordResources(cloned);
      },
      // modern-screenshot redraws once per embedded image, 100 ms apart by default, which adds up
      // on pages with many images. A few redraws over about 150 ms are enough.
      drawImageInterval: 50,
      onCreateForeignObjectSvg: limitRedraws,
      features: overlayFeatures,
      autoDestruct: false,
    });
  }
  const { width, height } = node.getBoundingClientRect();
  Object.assign(overlayContext, { width, height, scale: window.devicePixelRatio });
  return overlayContext;
};

const toRect = ({ left, top, right, bottom }: DOMRect): Rect => ({ left, top, right, bottom });

const intersect = (a: Rect, b: Rect): Rect => ({
  left: Math.max(a.left, b.left),
  top: Math.max(a.top, b.top),
  right: Math.min(a.right, b.right),
  bottom: Math.min(a.bottom, b.bottom),
});

const isEmpty = (rect: Rect) => rect.right <= rect.left || rect.bottom <= rect.top;

// Parses a computed `clip: rect(top, right, bottom, left)` into page coordinates. Offsets are
// relative to the element's border box and `auto` stands for the border box edge.
const getClipRect = (computed: CSSStyleDeclaration, box: Rect): Rect | null => {
  const match = /^rect\((.+)\)$/.exec(computed.clip.trim());
  const values = match?.[1].trim().split(/[\s,]+/);
  if (!values || values.length !== 4) {
    return null;
  }
  const [top, right, bottom, left] = values.map((value) => parseFloat(value));
  return {
    top: Number.isNaN(top) ? box.top : box.top + top,
    right: Number.isNaN(right) ? box.right : box.left + right,
    bottom: Number.isNaN(bottom) ? box.bottom : box.top + bottom,
    left: Number.isNaN(left) ? box.left : box.left + left,
  };
};

// The part of the canvas that is actually visible: its box narrowed by every ancestor's CSS clip
// (mapbox-gl-compare clips each map container) and overflow, up to and including the root.
const getVisibleRect = (canvas: HTMLCanvasElement, root: HTMLElement): Rect => {
  const rootRect = toRect(root.getBoundingClientRect());
  let visible = intersect(toRect(canvas.getBoundingClientRect()), rootRect);

  for (let el = canvas.parentElement; el && !isEmpty(visible); el = el.parentElement) {
    const computed = getComputedStyle(el);
    const box = toRect(el.getBoundingClientRect());
    const clip = getClipRect(computed, box);
    if (clip) {
      visible = intersect(visible, clip);
    }
    if (computed.overflowX !== "visible") {
      visible = intersect(visible, { ...visible, left: box.left, right: box.right });
    }
    if (computed.overflowY !== "visible") {
      visible = intersect(visible, { ...visible, top: box.top, bottom: box.bottom });
    }
    if (el === root) {
      break;
    }
  }
  return visible;
};

// Loaded on first use so it stays out of the main bundle.
const loadModernScreenshot = () => import("modern-screenshot");

// Starts loading the library when the screenshot button is clicked, while the screenshot-only
// styles paint, so the first capture doesn't wait for it.
export const preloadScreenshot = () => {
  loadModernScreenshot().catch(() => undefined);
};

const renderPNG = async (node: HTMLElement) => {
  const screenshot = await loadModernScreenshot();

  // Map canvases are drawn directly instead of going through modern-screenshot. Embedding a large
  // canvas as an image inside an SVG foreignObject makes WebKit sometimes rasterize the SVG before
  // the image has decoded, which leaves the map blank.
  const context = await getOverlayContext(screenshot, node);
  newResources = new Set();
  overlayFeatures.fixSvgXmlDecode = false;
  const overlay = await screenshot.domToCanvas(context);
  newResources.forEach((resource) => drawnResources.add(resource));

  const output = document.createElement("canvas");
  output.width = overlay.width;
  output.height = overlay.height;
  const ctx = output.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is not available");
  }

  // Scale the map canvases to the width the overlay was actually rendered at (its pixel size is
  // rounded down).
  const nodeRect = node.getBoundingClientRect();
  const scale = overlay.width / context.width;

  node.querySelectorAll<HTMLCanvasElement>("canvas.mapboxgl-canvas").forEach((canvas) => {
    const visible = getVisibleRect(canvas, node);
    if (isEmpty(visible)) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      (visible.left - nodeRect.left) * scale,
      (visible.top - nodeRect.top) * scale,
      (visible.right - visible.left) * scale,
      (visible.bottom - visible.top) * scale,
    );
    ctx.clip();
    ctx.drawImage(
      canvas,
      (rect.left - nodeRect.left) * scale,
      (rect.top - nodeRect.top) * scale,
      rect.width * scale,
      rect.height * scale,
    );
    ctx.restore();
  });

  ctx.drawImage(overlay, 0, 0);
  return output.toDataURL("image/png");
};

// Captures share one context, so each one waits for the previous one to finish.
let pendingCapture: Promise<unknown> = Promise.resolve();

export const exportComponentAsPNG = (
  componentRef: RefObject<HTMLElement>,
  fileName: string,
): Promise<void> => {
  const capture = pendingCapture.then(async () => {
    const node = componentRef.current;
    if (node === null) {
      return;
    }
    saveAs(await renderPNG(node), fileName);
  });
  pendingCapture = capture.catch(() => undefined);
  return capture;
};

export const downloadFile = (fileBlob: Blob, fileName: string) => {
  const url = URL.createObjectURL(fileBlob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
