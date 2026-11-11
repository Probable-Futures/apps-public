import { RefObject } from "react";
import { toCanvas } from "html-to-image";

type Rect = { left: number; top: number; right: number; bottom: number };

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

export const exportComponentAsPNG = async (
  componentRef: RefObject<HTMLElement>,
  fileName: string,
) => {
  const node = componentRef.current;
  if (node === null) {
    return;
  }

  // Map canvases are drawn directly instead of going through html-to-image. Embedding a large
  // canvas as an image inside an SVG foreignObject makes WebKit sometimes rasterize the SVG before
  // the image has decoded, which leaves the map blank.
  const overlay = await toCanvas(node, { cacheBust: true, filter: (el) => !isMapCanvas(el) });

  const output = document.createElement("canvas");
  output.width = overlay.width;
  output.height = overlay.height;
  const ctx = output.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is not available");
  }

  // html-to-image can downscale very large canvases, so derive the scale from the result.
  const nodeRect = node.getBoundingClientRect();
  const scale = overlay.width / nodeRect.width;

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
  saveAs(output.toDataURL("image/png"), fileName);
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
