import type { Map as MapBoxMap } from "mapbox-gl";

/**
 * Removes the `role="list"` Mapbox puts on the attribution container. Its children are
 * plain links, not list items, so the role announces an empty list to screen readers.
 * Mapbox sets the role once when the control is added and later only replaces the
 * container's content, so removing it once per map is enough.
 */
export const removeAttributionListRole = (map: MapBoxMap) =>
  map.getContainer().querySelector(".mapboxgl-ctrl-attrib-inner")?.removeAttribute("role");
