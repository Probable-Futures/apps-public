import { useEffect } from "react";

import { useMapData } from "../contexts/DataContext";
import { AboutMapResources, DatasetDescriptionResponse } from "@probable-futures/lib";

type Object = {
  [key: string]: string;
};

const baseUrl = `${process.env.REACT_APP_WP_API}/`;
const headers = {
  Authorization: `Basic ${process.env.REACT_APP_WP_AUTH}`,
};

export default function useWPApi() {
  const {
    warmingScenarioDescs,
    setWarmingScenarioDescs,
    selectedClimateData,
    setSelectedClimateData,
    setDescription9010,
    setDescription955,
    setWpDatasetDescriptionResponse,
    setAboutMapResources,
  } = useMapData();

  const filterObjectBy = (obj: Object, filter: string) => {
    return Object.keys(obj)
      .filter((key) => key.startsWith(filter))
      .reduce((result: Object, key: string) => {
        result[key] = obj[key];
        return result;
      }, {});
  };

  useEffect(() => {
    async function fetchMapSettings() {
      const response = await fetch(`${baseUrl}acf/v3/options/map-settings`, {
        headers,
      });

      const body = await response.json();
      if (body.acf) {
        const warmingScenarioDescs = filterObjectBy(body.acf, "description_");
        setDescription9010(body.acf["9010_description"]);
        setDescription955(body.acf["955_description"]);
        setWarmingScenarioDescs(warmingScenarioDescs);

        const aboutMapResources: AboutMapResources = {
          explore_heading: body.acf.explore_heading,
          explore_subheading: body.acf.explore_subheading,
          related_heading: body.acf.related_heading,
          related_subheading: body.acf.related_subheading,
          resources: body.acf.resources,
          data_resources: body.acf.data_resources,
          warming_scenario_description: body.acf.warming_scenario_description,
        };
        setAboutMapResources?.(aboutMapResources);
      }
    }
    if (Object.keys(warmingScenarioDescs).length === 0) {
      fetchMapSettings();
    }
  }, [
    setWarmingScenarioDescs,
    setDescription9010,
    setDescription955,
    warmingScenarioDescs,
    setAboutMapResources,
  ]);

  useEffect(() => {
    async function fetchMapDescription() {
      const response = await fetch(
        `${baseUrl}wp/v2/maps?dataset_id=${selectedClimateData?.dataset.id}&map_version=${selectedClimateData?.mapVersion}&_fields=acf`,
        {
          headers,
        },
      );

      const body = await response.json();
      if (body[0] && body[0].acf) {
        setWpDatasetDescriptionResponse(body[0].acf as DatasetDescriptionResponse);
      }
    }
    if (selectedClimateData) {
      fetchMapDescription();
    }
  }, [selectedClimateData, setSelectedClimateData, setWpDatasetDescriptionResponse]);
}
