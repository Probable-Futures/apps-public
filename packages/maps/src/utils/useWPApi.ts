import { AboutMapResources, types } from "@probable-futures/lib/src";
import { useEffect, useMemo } from "react";

type Object = {
  [key: string]: string;
};

export const baseUrl = window.pfInteractiveMap?.wpApiUrl || `${process.env.REACT_APP_WP_API}/`;
export const headers = {
  Authorization: `Basic ${process.env.REACT_APP_WP_AUTH}`,
};

type Props = {
  selectedDataset?: types.Map;
  setSelectedDataset: (arg: any) => void;
  setWpDatasetDescriptionResponse: (arg: any) => void;
  locale: string;
  warmingScenarioDescs?: types.WarmingScenarioDescs;
  setInspectPromptLocation?: (arg: any) => void;
  setWarmingScenarioDescs?: (arg: any) => void;
  setSteps?: (arg: any) => void;
  setAboutMapResources?: (arg: AboutMapResources) => void;
};

export default function useWPApi({
  selectedDataset,
  warmingScenarioDescs,
  setSelectedDataset,
  setWarmingScenarioDescs,
  setWpDatasetDescriptionResponse,
  setInspectPromptLocation,
  setSteps,
  setAboutMapResources,
  locale,
}: Props) {
  const urlWithLocale = useMemo(() => {
    const url = new URL(baseUrl);
    if (locale === "en") {
      return baseUrl;
    }
    return url.origin + "/" + locale + url.pathname;
  }, [locale]);

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
      const response = await fetch(`${urlWithLocale}acf/v3/options/map-settings`, {
        headers,
      });

      const body = await response.json();
      if (body.acf) {
        const warmingScenarioDescs = filterObjectBy(body.acf, "description_");
        const tourSteps = filterObjectBy(body.acf, "tour_part_");
        setWarmingScenarioDescs?.(warmingScenarioDescs);
        setSteps?.(tourSteps);
        setInspectPromptLocation?.(body.acf.inspect_prompt_location);

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
    if (warmingScenarioDescs && Object.keys(warmingScenarioDescs).length === 0) {
      fetchMapSettings();
    }
  }, [
    warmingScenarioDescs,
    urlWithLocale,
    setWarmingScenarioDescs,
    setSteps,
    setInspectPromptLocation,
    setAboutMapResources,
  ]);

  useEffect(() => {
    async function fetchMapDescription() {
      const response = await fetch(
        `${urlWithLocale}wp/v2/maps?dataset_id=${selectedDataset?.dataset.id}&map_version=${selectedDataset?.mapVersion}&_fields=acf`,
        {
          headers,
        },
      );

      const body = await response.json();
      if (body[0] && body[0].acf) {
        setWpDatasetDescriptionResponse(body[0].acf as types.DatasetDescriptionResponse);
      }
    }
    if (selectedDataset) {
      fetchMapDescription();
    }
  }, [selectedDataset, urlWithLocale, setWpDatasetDescriptionResponse, setSelectedDataset]);
}
