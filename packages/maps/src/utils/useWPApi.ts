import { types } from "@probable-futures/lib/src";
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
  setStories?: (arg: any) => void;
  setSelectedStory?: (arg: any) => void;
  setWarmingScenarioDescs?: (arg: any) => void;
  setStorySubmission?: (arg: any) => void;
  setSteps?: (arg: any) => void;
};

export default function useWPApi({
  selectedDataset,
  warmingScenarioDescs,
  setSelectedDataset,
  setStories,
  setSelectedStory,
  setWarmingScenarioDescs,
  setStorySubmission,
  setWpDatasetDescriptionResponse,
  setInspectPromptLocation,
  setSteps,
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
        setStorySubmission?.(body.acf.vignette_story_submission_instructions);
        setInspectPromptLocation?.(body.acf.inspect_prompt_location);
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
    setStorySubmission,
    setInspectPromptLocation,
  ]);

  useEffect(() => {
    async function fetchStories() {
      const response = await fetch(
        `${urlWithLocale}wp/v2/maps?parent_dataset_id=${selectedDataset?.dataset.id}&_fields=id,title,acf&per_page=100`,
        {
          headers,
        },
      );

      const body = await response.json();
      setStories?.(body);
    }
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
      setSelectedStory?.(undefined);
      fetchStories();
      fetchMapDescription();
    }
  }, [
    selectedDataset,
    urlWithLocale,
    setWpDatasetDescriptionResponse,
    setSelectedDataset,
    setSelectedStory,
    setStories,
  ]);
}
