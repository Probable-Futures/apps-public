export type ParentCategory = {
  name: string;
  label: string;
};

export type Dataset = {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  pfDatasetParentCategoryByParentCategory: ParentCategory;
  subCategory: string | null;
  model?: string;
  unit: string;
  pfDatasetUnitByUnit: {
    unitLong: string;
  };
  minValue: number;
  maxValue: number;
  dataVariables: string[] | null;
};

export type Map = {
  mapStyleId: string;
  name: string;
  description?: string;
  stops: number[];
  binHexColors: string[];
  status?: string;
  dataset: Dataset;
  isDiff: boolean;
  step: number;
  binningType: "number" | "range";
  binLabels?: string[] | null;
  slug: string;
  mapVersion: number;
  isLatest: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  dataLabels: string[];
  methodUsedForMid: string;
};

export type ClimateZoneSubGroup = {
  name: string;
  value: string;
  symbol: string;
  description: string;
  technicalName?: string;
};

export type ClimateZoneGroup = {
  name: string;
  description: string;
  list: Array<ClimateZoneSubGroup>;
};

export type DatasetDescriptionResponse = {
  dataset_description: string;
  dataset_id: string;
  vignette_title_wysiwyg: string;
  map_volume: boolean;
  climate_zones?: Array<ClimateZoneGroup>;
};

export type WarmingScenarioDescs = {
  description_baseline?: string;
  description_1c?: string;
  description_15c?: string;
  description_2c?: string;
  description_25c?: string;
  description_3c?: string;
  description_baseline_change_maps?: string;
};

export type Option = {
  value: string | number;
  label: string;
  options?: Option[];
};

export type GroupedOptions = {
  label: string;
  options: Option[];
};

export type Steps = {
  [key: string]: string | any;
};

type StoryFeaturedImage = {
  alt: string;
  caption: string;
  sizes: {
    medium_large: string;
  };
};

type StoryFeaturedAudio = {
  url: string;
};

export type StoryFeaturedMedia = {
  featured_media_type: "image" | "audio" | "video";
  image: boolean | StoryFeaturedImage;
  audio: boolean | StoryFeaturedAudio;
  video: string;
};

export type Story = {
  id: number;
  title: {
    rendered: string;
  };
  acf: {
    vignette_title_wysiwyg: string;
    vignette_location: {
      latitude_longitude: {
        lat: number;
        lng: number;
      };
      pin_size: "small" | "medium" | "large";
      pin_hover_text_wysiwyg: string;
      name_wysiwyg: string;
      climate_zone_wysiwyg: string;
      population_wysiwyg: string;
    };
    vignette_contributor: {
      name_wysiwyg: string;
      title_wysiwyg: string;
      link: string;
    };
    vignette_body: string;
    vignette_featured_media: StoryFeaturedMedia;
  };
};

export type TourProps = {
  step: number;
  isTourActive: boolean;
  steps: Steps;
  stories: Story[];
  onNext: () => void;
  onClose: () => void;
};

export type TempUnit = "°C" | "°F";

export type PrecipitationUnit = "mm" | "in";
