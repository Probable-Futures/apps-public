import { consts } from "@probable-futures/lib";

/** The slice of a Mapbox map this needs, so a plain object can stand in under test. */
export type RefreshableMap = {
  project(lngLat: [number, number]): { x: number; y: number };
  getCanvas(): { clientWidth: number; clientHeight: number };
  queryRenderedFeatures(point: [number, number]): Array<any> | undefined;
  on(event: "idle", handler: () => void): void;
  off(event: "idle", handler: () => void): void;
};

type Options = {
  map: RefreshableMap;
  lngLat: [number, number];
  onFeatures: (features: Array<any> | undefined) => void;
};

const dataProperties = (features: Array<any> | undefined) =>
  features?.find(({ layer }) => layer?.id?.includes(consts.DATA_LAYER_ID_PREFIX))?.properties;

/**
 * Keeps an open popup reading the style that is actually on screen, and returns
 * the unsubscribe.
 *
 * A style swap passes through more than one `idle`: the outgoing style can settle
 * before the incoming tiles are queryable, so reading once is as likely to catch
 * the old data as the new. Reading on every `idle` converges instead, and the
 * signature keeps the extra readings from reaching React.
 */
export const subscribePopupRefresh = ({ map, lngLat, onFeatures }: Options): (() => void) => {
  let lastSignature: string | undefined;

  const refresh = () => {
    const point = map.project(lngLat);
    const canvas = map.getCanvas();
    // Panned out of view, so there is nothing to read; the popup keeps what it
    // has rather than blanking on its way off screen.
    if (
      point.x < 0 ||
      point.y < 0 ||
      point.x > canvas.clientWidth ||
      point.y > canvas.clientHeight
    ) {
      return;
    }
    // Queried unfiltered because the red/blue diff styles author their data
    // layers separately; the prefix is what identifies the data layer.
    const features = map.queryRenderedFeatures([point.x, point.y]);
    const signature = JSON.stringify(dataProperties(features) ?? null);
    if (signature === lastSignature) {
      return;
    }
    lastSignature = signature;
    onFeatures(features);
  };

  refresh();
  map.on("idle", refresh);
  return () => map.off("idle", refresh);
};
