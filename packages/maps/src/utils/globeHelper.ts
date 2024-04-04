export const lineMaxZoom = 6;

export const latitudeLines: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
  type: "FeatureCollection",
  features: [
    {
      id: "arctic-circle",
      type: "Feature",
      properties: {
        name: "Arctic Circle",
        lat: "66.5",
        direction: "north",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-180, 66.5],
          [180, 66.5],
        ],
      },
    },
    {
      id: "tropic-of-cancer",
      type: "Feature",
      properties: {
        name: "Tropic of Cancer",
        lat: "23.5",
        direction: "north",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-180, 23.5],
          [180, 23.5],
        ],
      },
    },
    {
      id: "equator",
      type: "Feature",
      properties: {
        name: "Equator",
        lat: "0",
        direction: "",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-180, 0],
          [180, 0],
        ],
      },
    },
    {
      id: "tropic-of-copricorn",
      type: "Feature",
      properties: {
        name: "Tropic of Copricorn",
        lat: "23.5",
        direction: "south",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-180, -23.5],
          [180, -23.5],
        ],
      },
    },
    {
      id: "antarctic-circle",
      type: "Feature",
      properties: {
        name: "Antarctic Circle",
        lat: "66.5",
        direction: "south",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-180, -66.5],
          [180, -66.5],
        ],
      },
    },
  ],
};

// generate longitude lines with an increment of 30degrees
export const generateLongitudeLines = () => {
  const longitudeLines: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
    type: "FeatureCollection",
    features: [],
  };
  let long = -180;
  while (long <= 150) {
    longitudeLines.features.push({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [long, 90],
          [long, -90],
        ],
      },
      properties: {
        name: Math.abs(long) + "°",
      },
    });
    long += 30;
  }

  return longitudeLines;
};
