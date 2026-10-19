import debounce from "lodash.debounce";
import type { Map as MapBoxMap, MapboxEvent } from "mapbox-gl";

export type MapViewState = { longitude: number; latitude: number; zoom: number };

export const MOVE_END_SETTLE_MS = 250;

/**
 * Reports the view of a set of synced maps once they stop moving.
 *
 * mapbox-gl-compare mirrors every frame of a pan or zoom onto the other map with
 * `jumpTo`, and each `jumpTo` fires its own `moveend`, so a single gesture emits a
 * `moveend` per animation frame. The listener waits until no `moveend` has fired for
 * `MOVE_END_SETTLE_MS` and then calls `onSettled` once with the last map's view.
 *
 * Returns a function that removes the listeners and delivers any pending view.
 */
export function onSettledMoveEnd(
  maps: MapBoxMap[],
  onSettled: (viewState: MapViewState) => void,
): () => void {
  const report = debounce((map: MapBoxMap) => {
    const center = map.getCenter();
    onSettled({ longitude: center.lng, latitude: center.lat, zoom: map.getZoom() });
  }, MOVE_END_SETTLE_MS);

  const handleMoveEnd = (event: MapboxEvent) => report(event.target);
  maps.forEach((map) => map.on("moveend", handleMoveEnd));

  return () => {
    maps.forEach((map) => map.off("moveend", handleMoveEnd));
    report.flush();
  };
}
