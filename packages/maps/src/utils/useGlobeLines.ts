import { useCallback, useEffect, useState } from "react";
import { GeoJSONSource, MapRef, Projection } from "react-map-gl";

import { latitudeLines, lineMaxZoom, generateLongitudeLines } from "./globeHelper";

const LONGITUDE_LINES_ID = "longitude-lines";
const LATITUDE_LINES_ID = "latitude-lines";
const LATITUDE_LINE_LABELS_LONGITUDES = [-105, 45];
export const LINE_LAYER_LABEL_PREFIX = "line-label-layer";
export const LINE_LAYER_SOURCE_PREFIX = "line-label-source";

const useGlobeLines = (mapProjection: Projection, mapRef?: MapRef | null) => {
  const [recentZoomLevel, setRecentZoomLevel] = useState(2.2);

  const getClosestLongitudeToViewport = useCallback((map: mapboxgl.Map) => {
    const newCenter = map.getCenter();
    const closestLongitudeLine = Math.round(newCenter.lng / 30) * 30; // rounding the center longitude to the nearest multiple of 30 degrees

    const west = map.getBounds().getWest();
    const east = map.getBounds().getEast();

    const diffToWest = Math.abs(Math.abs(closestLongitudeLine) - Math.abs(west));
    const diffToEast = Math.abs(Math.abs(closestLongitudeLine) - Math.abs(east));

    if (diffToWest < diffToEast) {
      return closestLongitudeLine + 15;
    } else {
      return closestLongitudeLine - 15;
    }
  }, []);

  const hideLatitudeLineLabelsAtZoomLessThanFour = useCallback((map: mapboxgl.Map) => {
    latitudeLines.features.forEach((latLine) => {
      LATITUDE_LINE_LABELS_LONGITUDES.forEach((_, index) => {
        if (map.getLayer(`${LINE_LAYER_LABEL_PREFIX}-${latLine.id}-${index}`)) {
          map.setLayoutProperty(
            `${LINE_LAYER_LABEL_PREFIX}-${latLine.id}-${index}`,
            "visibility",
            "none",
          );
        }
      });
    });
  }, []);

  const hideLatitudeLineLabelsAtZoomBiggerOrEqualToFour = useCallback((map: mapboxgl.Map) => {
    latitudeLines.features.forEach((latLine) => {
      if (map.getLayer(`${LINE_LAYER_LABEL_PREFIX}-${latLine.id}-3`)) {
        map.setLayoutProperty(`${LINE_LAYER_LABEL_PREFIX}-${latLine.id}-3`, "visibility", "none");
      }
    });
  }, []);

  const removeGlobeLayers = useCallback(() => {
    if (!mapRef) {
      return;
    }
    const map = mapRef.getMap();
    try {
      // remove layers first after checking if they exist
      if (map.getLayer(`${LONGITUDE_LINES_ID}-layer`)) {
        map.removeLayer(`${LONGITUDE_LINES_ID}-layer`);
      }
      if (map.getLayer(`${LATITUDE_LINES_ID}-layer`)) {
        map.removeLayer(`${LATITUDE_LINES_ID}-layer`);
      }

      hideLatitudeLineLabelsAtZoomLessThanFour(map);

      // remove sources second after checking if they exist
      if (map.getSource(LONGITUDE_LINES_ID)) {
        map.removeSource(LONGITUDE_LINES_ID);
      }
      if (map.getSource(LATITUDE_LINES_ID)) {
        map.removeSource(LATITUDE_LINES_ID);
      }
    } catch (e) {
      console.error("Failed to remove layers", e);
    }
  }, [mapRef, hideLatitudeLineLabelsAtZoomLessThanFour]);

  const addLatitudeLineLabels = (map: mapboxgl.Map, longitude: number, tag: string) => {
    latitudeLines.features.forEach((latLine) => {
      if (map.getLayer(`${LINE_LAYER_LABEL_PREFIX}-${latLine.id}-${tag}`)) {
        map.setLayoutProperty(
          `${LINE_LAYER_LABEL_PREFIX}-${latLine.id}-${tag}`,
          "visibility",
          "visible",
        );
      } else {
        map.addLayer({
          id: `${LINE_LAYER_LABEL_PREFIX}-${latLine.id}-${tag}`,
          type: "symbol",
          source: {
            type: "geojson",
            data: {
              id: `${LINE_LAYER_SOURCE_PREFIX}-${latLine.id}-${tag}`,
              type: "Feature",
              properties: {
                name: `${latLine.properties?.name || ""} \n ${latLine.properties?.lat || ""}° ${
                  latLine.properties?.direction || ""
                }`,
              },
              geometry: {
                type: "Point",
                // @ts-ignore
                coordinates: [longitude, latLine.geometry.coordinates[0][1]],
              },
            },
          },
          layout: {
            "text-field": ["to-string", ["get", "name"]],
            "text-size": 12,
            "text-pitch-alignment": "auto",
            "symbol-placement": "point",
            "text-rotation-alignment": "auto",
            "text-font": ["Open Sans Regular"],
            "text-allow-overlap": true,
            "text-anchor": "center",
            "text-ignore-placement": false,
            "symbol-avoid-edges": false,
            "text-rotate": 0,
          },
          paint: {
            "text-color": "#000",
            "text-halo-color": "#fff",
            "text-halo-width": 1,
            "text-opacity": 1,
          },
          maxzoom: lineMaxZoom,
        });
      }
    });
  };

  const drawGlobeLines = useCallback(() => {
    const addLatitudeLines = (map: mapboxgl.Map) => {
      map.addSource(LATITUDE_LINES_ID, {
        type: "geojson",
        data: latitudeLines,
      });
      map.addLayer({
        id: `${LATITUDE_LINES_ID}-layer`,
        type: "line",
        source: LATITUDE_LINES_ID,
        paint: {
          "line-color": "#b0b0b0",
          "line-width": 1,
        },
        maxzoom: lineMaxZoom,
      });
    };

    const addLongitudeLines = (map: mapboxgl.Map) => {
      const longitudeLines = generateLongitudeLines();
      map.addSource(LONGITUDE_LINES_ID, {
        type: "geojson",
        data: longitudeLines,
      });
      map.addLayer({
        id: `${LONGITUDE_LINES_ID}-layer`,
        type: "line",
        source: LONGITUDE_LINES_ID,
        paint: {
          "line-color": "#b0b0b0",
          "line-width": 1,
        },
        maxzoom: lineMaxZoom,
      });
    };

    removeGlobeLayers();

    const map = mapRef?.getMap();
    if (!map) {
      return;
    }
    // add latitude lines
    try {
      addLatitudeLines(map);
    } catch (e) {
      console.error("Failed to add latitude lines", e);
    }

    // add longitude lines: multiple lines sperated by 30degrees
    try {
      addLongitudeLines(map);
    } catch (e) {
      console.error("Failed to add longitude lines", e);
    }

    // add latitude labels
    try {
      const zoom = map.getZoom();
      setRecentZoomLevel(zoom);
      if (zoom < 4) {
        LATITUDE_LINE_LABELS_LONGITUDES.forEach((latitudeLineLabelsLongitude, index) => {
          addLatitudeLineLabels(map, latitudeLineLabelsLongitude, index.toString());
        });
      } else if (zoom < 6) {
        addLatitudeLineLabels(map, map.getCenter().lng, "3");
      }
    } catch (e) {
      console.error("Failed to add latitued line labels", e);
    }
  }, [mapRef, removeGlobeLayers]);

  useEffect(() => {
    if (mapRef && mapProjection.name === "globe") {
      const map = mapRef.getMap();
      const updateLabelsPlacement = () => {
        const zoom = map.getZoom();
        setRecentZoomLevel(zoom);
        // zoomed out from zoom level bigger than 4 to a zoom level less than or equal to 4
        if (zoom < 4 && recentZoomLevel >= 4) {
          hideLatitudeLineLabelsAtZoomBiggerOrEqualToFour(map);
          LATITUDE_LINE_LABELS_LONGITUDES.forEach((latitudeLineLabelsLongitude, index) => {
            addLatitudeLineLabels(map, latitudeLineLabelsLongitude, index.toString());
          });
        } else if (recentZoomLevel < 4 && zoom >= 4) {
          hideLatitudeLineLabelsAtZoomLessThanFour(map);
          addLatitudeLineLabels(map, getClosestLongitudeToViewport(map), "3");
        }
      };

      map.on("zoom", updateLabelsPlacement);
      return () => {
        map.off("zoom", updateLabelsPlacement);
      };
    }
  }, [
    mapProjection,
    mapRef,
    recentZoomLevel,
    getClosestLongitudeToViewport,
    hideLatitudeLineLabelsAtZoomLessThanFour,
    hideLatitudeLineLabelsAtZoomBiggerOrEqualToFour,
  ]);

  useEffect(() => {
    if (mapRef && mapProjection.name === "globe") {
      const map = mapRef.getMap();
      const updateLabelsPlacement = () => {
        const zoom = map.getZoom();
        if (zoom >= 4) {
          latitudeLines.features.forEach((latLine) => {
            if (map.getSource(`${LINE_LAYER_LABEL_PREFIX}-${latLine.id}-3`)) {
              const latLineSource = map.getSource(
                `${LINE_LAYER_LABEL_PREFIX}-${latLine.id}-3`,
              ) as GeoJSONSource;
              latLineSource.setData({
                id: `${LINE_LAYER_SOURCE_PREFIX}-${latLine.id}-3`,
                type: "Feature",
                properties: {
                  name: `${latLine.properties?.name || ""} \n ${latLine.properties?.lat || ""}° ${
                    latLine.properties?.direction || ""
                  }`,
                },
                geometry: {
                  type: "Point",
                  coordinates: [
                    getClosestLongitudeToViewport(map),
                    // @ts-ignore
                    latLine.geometry.coordinates[0][1],
                  ],
                },
              });
            }
          });
        }
      };

      map.on("move", updateLabelsPlacement);
      return () => {
        map.off("move", updateLabelsPlacement);
      };
    }
  }, [mapRef, getClosestLongitudeToViewport, mapProjection]);

  return { drawGlobeLines, removeGlobeLayers };
};

export default useGlobeLines;
