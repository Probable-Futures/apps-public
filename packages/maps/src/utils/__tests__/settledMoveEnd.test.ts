import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Map as MapBoxMap } from "mapbox-gl";
import { MOVE_END_SETTLE_MS, onSettledMoveEnd } from "../settledMoveEnd";

type MoveEndListener = (event: { target: FakeMap }) => void;

class FakeMap {
  private center = { lng: 0, lat: 0 };
  private zoom = 2.2;
  private listeners = new Set<MoveEndListener>();

  on(_type: "moveend", listener: MoveEndListener) {
    this.listeners.add(listener);
  }

  off(_type: "moveend", listener: MoveEndListener) {
    this.listeners.delete(listener);
  }

  getCenter() {
    return this.center;
  }

  getZoom() {
    return this.zoom;
  }

  // Moves the map the way mapbox-gl-compare's jumpTo does: synchronously, ending in a moveend.
  jumpTo(lng: number, lat: number, zoom: number) {
    this.center = { lng, lat };
    this.zoom = zoom;
    this.listeners.forEach((listener) => listener({ target: this }));
  }
}

const asMapboxMap = (map: FakeMap) => map as unknown as MapBoxMap;
const FRAME_MS = 16;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("onSettledMoveEnd", () => {
  it("reports one view after a pan that fires a moveend on every frame", () => {
    const before = new FakeMap();
    const after = new FakeMap();
    const onSettled = vi.fn();
    onSettledMoveEnd([asMapboxMap(before), asMapboxMap(after)], onSettled);

    // A 2 second drag on the before map, mirrored onto the after map each frame.
    for (let frame = 1; frame <= 120; frame++) {
      after.jumpTo(frame / 10, frame / 20, 3);
      vi.advanceTimersByTime(FRAME_MS);
    }
    before.jumpTo(12, 6, 3);

    expect(onSettled).not.toHaveBeenCalled();
    vi.advanceTimersByTime(MOVE_END_SETTLE_MS);
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith({ longitude: 12, latitude: 6, zoom: 3 });
  });

  it("reports each separate gesture", () => {
    const map = new FakeMap();
    const onSettled = vi.fn();
    onSettledMoveEnd([asMapboxMap(map)], onSettled);

    map.jumpTo(10, 20, 4);
    vi.advanceTimersByTime(MOVE_END_SETTLE_MS);
    map.jumpTo(-30, 40, 5);
    vi.advanceTimersByTime(MOVE_END_SETTLE_MS);

    expect(onSettled.mock.calls).toEqual([
      [{ longitude: 10, latitude: 20, zoom: 4 }],
      [{ longitude: -30, latitude: 40, zoom: 5 }],
    ]);
  });

  it("delivers the pending view and stops listening when cleaned up", () => {
    const map = new FakeMap();
    const onSettled = vi.fn();
    const stop = onSettledMoveEnd([asMapboxMap(map)], onSettled);

    map.jumpTo(10, 20, 4);
    stop();
    expect(onSettled).toHaveBeenCalledTimes(1);
    expect(onSettled).toHaveBeenCalledWith({ longitude: 10, latitude: 20, zoom: 4 });

    map.jumpTo(-30, 40, 5);
    vi.advanceTimersByTime(MOVE_END_SETTLE_MS);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });
});
