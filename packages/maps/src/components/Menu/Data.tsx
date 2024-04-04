import { useMemo } from "react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";
import camelcase from "lodash.camelcase";

import Dropdown from "../common/Dropdown";
import CustomSwitch from "../common/CustomSwitch";
import { useMenu } from "../../components/Menu";
import { Title } from "./Menu.styled";
import { setQueryParam } from "../../utils";
import useMapsApi from "../../utils/useMapsApi";
import { colors } from "../../consts";
import { useTranslation } from "../../contexts/TranslationContext";
import useWPApi from "../../utils/useWPApi";

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const Section = styled.div`
  padding: 12px 20px 12px 52px;
  ${({ showBorder = true }: { showBorder?: boolean }) =>
    showBorder && `border-bottom: 1px solid ${colors.lightGrey}`};
`;

const Option = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const SwitchLabel = styled.span`
  flex: 1;
  color: ${colors.darkPurple};
  font-size: 14px;
  letter-spacing: 0;
  line-height: 16px;
`;

export default function Data(): JSX.Element {
  const {
    data: {
      selectedDataset,
      datasets,
      filterByStatus,
      filterByCategory,
      showInspector,
      midValueShown,
      setSelectedDataset,
      setFilterByStatus,
      setFilterByCategory,
      setShowInspector,
      setMidValueShown,
      setDatasets,
      setDegrees,
      setWpDatasetDescriptionResponse,
    },
    mapStyle: { setColorScheme, setBins },
  } = useMenu();

  const { translate, locale } = useTranslation();
  useMapsApi({
    datasets,
    fetchAllMaps: true,
    setDatasets,
    setSelectedDataset,
    setDegrees,
    setColorScheme,
    setBins,
    setMidValueShown,
  });
  useWPApi({
    selectedDataset,
    setSelectedDataset,
    setWpDatasetDescriptionResponse,
    locale,
  });
  const datasetOptions = useMemo(() => {
    return datasets
      .filter(({ isLatest }) => isLatest)
      .filter(({ status }) => (filterByStatus === "all" ? true : status === filterByStatus))
      .filter(({ dataset: { pfDatasetParentCategoryByParentCategory: category } }) =>
        filterByCategory === "all" ? true : category.name === filterByCategory,
      )
      .map(({ slug, dataset, name }) => ({
        label: `${translate(`header.datasets.${camelcase(slug)}`, name)} - ${dataset.model}`,
        value: slug,
      }));
  }, [datasets, filterByStatus, filterByCategory, translate]);
  const defaultValue = { value: "", label: "" };
  const filterOptions = [
    { label: translate("menu.data.filterOptions.all"), value: "all" },
    { label: translate("menu.data.filterOptions.draft"), value: "draft" },
    { label: translate("menu.data.filterOptions.published"), value: "published" },
    { label: translate("menu.data.filterOptions.archive"), value: "archive" },
  ];

  const midValueOptions = useMemo(() => {
    const allDatasets = datasets.filter(
      (data) =>
        data.dataset.id === selectedDataset?.dataset.id &&
        data.mapVersion === selectedDataset.mapVersion,
    );
    const uniqueMidValueOptions = [...new Set(allDatasets.map((data) => data.methodUsedForMid))];
    return uniqueMidValueOptions.map((option) => ({
      label: translate(`menu.data.midValueOptions.${camelcase(option)}`, option),
      value: camelcase(option),
    }));
  }, [datasets, selectedDataset, translate]);

  const volumeOptions = useMemo(() => {
    const options = [{ label: translate("menu.data.volumeOptions.all"), value: "all" }];
    const categories = datasets.map(
      ({ dataset: { pfDatasetParentCategoryByParentCategory: category } }) => category.name,
    );
    const uniqueCategories = [...new Set(categories)];
    uniqueCategories.forEach((category: string) =>
      options.push({ label: translate("menu.data.volumeOptions")[category], value: category }),
    );
    return options;
  }, [datasets, translate]);

  const onDatasetChange = (option?: { label: String; value: String }, dataset?: types.Map) => {
    let finalDataset = dataset;
    if (!finalDataset && option) {
      finalDataset = datasets.find(
        ({ slug, isLatest, status }) =>
          slug === option.value && isLatest && status === filterByStatus,
      );
    }
    if (finalDataset) {
      setSelectedDataset(finalDataset);
      setColorScheme(finalDataset.binHexColors);
      setBins(finalDataset.stops);
      setQueryParam({ mapSlug: finalDataset.slug });
      setMidValueShown(finalDataset.methodUsedForMid);
    }
  };

  const onFilterChange = (option: { label: String; value: String }) => {
    setFilterByStatus(option.value);
  };

  const onCategoryChange = (option: { label: String; value: String }) => {
    setFilterByCategory(option.value);
  };

  const onMidValueShownChange = (option: { label: String; value: String }) => {
    if (option.value !== midValueShown) {
      const dataset = datasets.find(
        (data) =>
          data.dataset.id === selectedDataset?.dataset.id &&
          data.methodUsedForMid === option.value &&
          data.mapVersion === selectedDataset.mapVersion,
      );
      if (dataset) {
        onDatasetChange(undefined, dataset);
      }
    }
  };

  return (
    <Container>
      <Section showBorder={false}>
        <Title>{translate("menu.data.dataSet")}</Title>
        <Dropdown
          value={
            selectedDataset
              ? {
                  value: selectedDataset.slug,
                  label: `${translate(
                    `header.datasets.${camelcase(selectedDataset.slug)}`,
                    selectedDataset.name,
                  )} - ${selectedDataset.dataset.model}`,
                }
              : defaultValue
          }
          options={datasetOptions}
          onChange={onDatasetChange}
        />
      </Section>
      <Section showBorder={false}>
        <Title>{translate("menu.data.mapStatus")}</Title>
        <Dropdown
          value={filterOptions.find((option) => option.value === filterByStatus) || defaultValue}
          options={filterOptions}
          onChange={onFilterChange}
        />
      </Section>
      <Section>
        <Title>{translate("menu.data.volume")}</Title>
        <Dropdown
          value={volumeOptions.find((option) => option.value === filterByCategory) || defaultValue}
          options={volumeOptions}
          onChange={onCategoryChange}
        />
      </Section>
      <Section showBorder={false}>
        <Option>
          <SwitchLabel>{translate("menu.data.showInspector")}</SwitchLabel>
          <CustomSwitch
            name="show_inspector"
            label={translate(showInspector ? "menu.mapStyle.on" : "menu.mapStyle.off")}
            checked={showInspector}
            onChange={(checked: boolean) => setShowInspector(checked)}
          />
        </Option>
      </Section>
      <Section>
        <Title>{translate("menu.data.midValueShown")}</Title>
        <Dropdown
          value={midValueOptions.find((option) => option.value === midValueShown) || defaultValue}
          options={midValueOptions}
          onChange={onMidValueShownChange}
        />
      </Section>
    </Container>
  );
}
