import camelcase from "lodash.camelcase";

import { groupByfield } from "@probable-futures/lib/src/utils";
import { Map, Option } from "@probable-futures/lib/src/types";

export const generateGroupedDatasets = (datasets: Map[], translatedDatasets: any = {}) => {
  const translatedParentCategories = translatedDatasets?.parentCategories || {};
  const translatedSubCategories = translatedDatasets?.subCategories || {};
  const latestDatasets = datasets.filter(({ isLatest }) => isLatest);

  const datasetsByCategory = Object.values(
    groupByfield<Map>(
      latestDatasets || [],
      "dataset.pfDatasetParentCategoryByParentCategory.label",
    ),
  ).map((parentCategories) => {
    const datasetsBySubCateg = Object.values(
      groupByfield<Map>(parentCategories.options, "dataset.subCategory"),
    );
    return {
      label:
        translatedParentCategories[camelcase(parentCategories.label)] || parentCategories.label,
      options: datasetsBySubCateg,
    };
  });

  let groupedOptions: Option[] = [];
  datasetsByCategory.forEach((category) => {
    category.options.forEach((subCategory) => {
      const option: Option = { label: "", value: "", options: [] };
      const subCategoryOptions = subCategory.options.map((dataset) => ({
        label: translatedDatasets[camelcase(dataset.slug)] || dataset.name,
        value: dataset.slug,
      }));
      // category does not have subcategories
      if (!subCategory.label) {
        let displayedCategName = category.label
          .replace("Maps of ", "")
          .replace("Other maps", "Other");
        displayedCategName =
          displayedCategName.charAt(0).toUpperCase() + displayedCategName.slice(1);
        option.label = displayedCategName;
        option.options = subCategoryOptions;
      } else {
        option.label = translatedSubCategories[camelcase(subCategory.label)] || subCategory.label;
        option.label = option.label.replace("heat", "temperature").replace("and", "&");
        option.value = subCategory.options[0].dataset.subCategory!;
        option.options = subCategoryOptions;
      }
      groupedOptions.push(option);
    });
  });

  return groupedOptions;
};
