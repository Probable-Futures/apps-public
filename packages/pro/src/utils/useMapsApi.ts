import { useEffect } from "react";
import { useQuery } from "@apollo/client";
import { types } from "@probable-futures/lib";

import { useMapData } from "../contexts/DataContext";
import { PUBLISHED_MAPS_QUERY } from "../graphql/queries/maps";
import { GRAPHQL_API_KEY } from "../consts/env";
import { useAppSelector } from "../app/hooks";

export default function useMapsApi() {
  const { climateData, setClimateData, setSelectedClimateData } = useMapData();
  const pfDatasetId = useAppSelector((state) => state.project.pfDatasetId);

  const { data } = useQuery(PUBLISHED_MAPS_QUERY, {
    context: {
      headers: {
        "api-key": GRAPHQL_API_KEY,
      },
    },
  });

  useEffect(() => {
    if (climateData.length === 0 && data && pfDatasetId) {
      const maps: types.Map[] = data.pfMaps.nodes;
      let mapIndex = maps.findIndex((m) => m.dataset.id === pfDatasetId);
      mapIndex = mapIndex === -1 ? 3 : mapIndex;
      setClimateData(maps);
      setSelectedClimateData(maps[mapIndex]);
    }
  }, [data, climateData.length, setClimateData, setSelectedClimateData, pfDatasetId]);
}
