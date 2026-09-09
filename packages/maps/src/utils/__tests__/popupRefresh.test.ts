import { describe, it, expect, vi } from "vitest";

import { subscribePopupRefresh, RefreshableMap } from "../popupRefresh";

const LNG_LAT: [number, number] = [10, 20];

const dataFeature = (mid: number) => ({
  layer: { id: "region-eu-af-1" },
  properties: { data_1c_mid: mid },
});

const basemapFeature = { layer: { id: "water" }, properties: {} };

/**
 * A map whose rendered features can be swapped between `idle` firings, which is
 * what a style change looks like from the subscription's side.
 */
const makeMap = (initial: Array<any> | undefined) => {
  let features = initial;
  let point = { x: 50, y: 50 };
  const handlers: (() => void)[] = [];

  const map: RefreshableMap = {
    project: () => point,
    getCanvas: () => ({ clientWidth: 100, clientHeight: 100 }),
    queryRenderedFeatures: () => features,
    on: (_event, handler) => {
      handlers.push(handler);
    },
    off: (_event, handler) => {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    },
  };

  return {
    map,
    setFeatures: (next: Array<any> | undefined) => {
      features = next;
    },
    setPoint: (next: { x: number; y: number }) => {
      point = next;
    },
    idle: () => handlers.forEach((handler) => handler()),
    listenerCount: () => handlers.length,
  };
};

describe("subscribePopupRefresh", () => {
  it("reads once immediately so a settled map does not wait for an idle", () => {
    const harness = makeMap([dataFeature(1)]);
    const onFeatures = vi.fn();

    subscribePopupRefresh({ map: harness.map, lngLat: LNG_LAT, onFeatures });

    expect(onFeatures).toHaveBeenCalledTimes(1);
  });

  // The regression: a style swap settles the outgoing style first, so the first
  // idle still carries the old data and only a later one has the new.
  it("keeps reading past a premature idle until the new style's data arrives", () => {
    const harness = makeMap([dataFeature(1)]);
    const onFeatures = vi.fn();

    subscribePopupRefresh({ map: harness.map, lngLat: LNG_LAT, onFeatures });
    onFeatures.mockClear();

    // Old style settles again — nothing new to report.
    harness.idle();
    expect(onFeatures).not.toHaveBeenCalled();

    // New style's tiles finally paint.
    harness.setFeatures([dataFeature(42)]);
    harness.idle();

    expect(onFeatures).toHaveBeenCalledTimes(1);
    expect(onFeatures.mock.calls[0][0]).toEqual([dataFeature(42)]);
  });

  it("stays subscribed across many idles rather than unsubscribing after the first", () => {
    const harness = makeMap([dataFeature(1)]);
    subscribePopupRefresh({ map: harness.map, lngLat: LNG_LAT, onFeatures: vi.fn() });

    harness.idle();
    harness.idle();

    expect(harness.listenerCount()).toBe(1);
  });

  it("does not push an update when the data has not changed", () => {
    const harness = makeMap([dataFeature(7)]);
    const onFeatures = vi.fn();

    subscribePopupRefresh({ map: harness.map, lngLat: LNG_LAT, onFeatures });
    onFeatures.mockClear();

    harness.idle();
    harness.idle();
    harness.idle();

    expect(onFeatures).not.toHaveBeenCalled();
  });

  it("reports a style that genuinely has no data there, so the popup can empty", () => {
    const harness = makeMap([dataFeature(1)]);
    const onFeatures = vi.fn();

    subscribePopupRefresh({ map: harness.map, lngLat: LNG_LAT, onFeatures });
    onFeatures.mockClear();

    harness.setFeatures([basemapFeature]);
    harness.idle();

    expect(onFeatures).toHaveBeenCalledTimes(1);
    expect(onFeatures.mock.calls[0][0]).toEqual([basemapFeature]);
  });

  it("ignores a point panned outside the canvas instead of blanking the popup", () => {
    const harness = makeMap([dataFeature(1)]);
    const onFeatures = vi.fn();

    subscribePopupRefresh({ map: harness.map, lngLat: LNG_LAT, onFeatures });
    onFeatures.mockClear();

    harness.setPoint({ x: -30, y: 50 });
    harness.setFeatures(undefined);
    harness.idle();

    expect(onFeatures).not.toHaveBeenCalled();
  });

  it("picks the data layer out from under the basemap layers above it", () => {
    const harness = makeMap([basemapFeature, dataFeature(3)]);
    const onFeatures = vi.fn();

    subscribePopupRefresh({ map: harness.map, lngLat: LNG_LAT, onFeatures });
    onFeatures.mockClear();

    // Same data layer, different basemap features on top: nothing to report.
    harness.setFeatures([dataFeature(3)]);
    harness.idle();

    expect(onFeatures).not.toHaveBeenCalled();
  });

  it("detaches its listener when unsubscribed", () => {
    const harness = makeMap([dataFeature(1)]);
    const unsubscribe = subscribePopupRefresh({
      map: harness.map,
      lngLat: LNG_LAT,
      onFeatures: vi.fn(),
    });

    expect(harness.listenerCount()).toBe(1);
    unsubscribe();
    expect(harness.listenerCount()).toBe(0);
  });
});
