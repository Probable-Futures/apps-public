import { useCallback, useEffect, useMemo } from "react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";
import camelcase from "lodash.camelcase";

import Dropdown from "../common/Dropdown";
import CustomSwitch from "../common/CustomSwitch";
import { ChangeMapDisplayOptionType, useMenu } from "../../components/Menu";
import { Section, Title } from "./Menu.styled";
import useMapsApi from "../../utils/useMapsApi";
import { colors } from "../../consts";
import { useTranslation } from "../../contexts/TranslationContext";
import useWPApi from "../../utils/useWPApi";
import {
  getDefaultVersionPair,
  getVersionLabel,
  getVersionsOfDataset,
} from "../../utils/mapVersions";

const Container = styled.div`
  display: flex;
  flex-direction: column;
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

const Hint = styled.p`
  color: ${colors.lightGrey2};
  font-size: 12px;
  letter-spacing: 0;
  line-height: 15px;
  margin: 8px 0 0;
`;

const VersionFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
`;

export default function Data(): JSX.Element {
  const {
    data: {
      selectedDataset,
      datasets,
      filterByStatus,
      filterByCategory,
      showInspector,
      changeMapDisplayOption,
      midValueShown,
      setSelectedDataset,
      setFilterByStatus,
      setFilterByCategory,
      setShowInspector,
      setChangeMapDisplayOption,
      setMidValueShown,
      setDatasets,
      setDegrees,
      setWpDatasetDescriptionResponse,
      isVersionComparisonActive,
      versionBefore,
      versionAfter,
      setIsVersionComparisonActive,
      setVersionBefore,
      setVersionAfter,
    },
    mapStyle: { dynamicStyleVariables, setDynamicStyleVariables },
  } = useMenu();

  const { translate, locale } = useTranslation();

  const setColorScheme = (binHexColors: any) => {
    setDynamicStyleVariables({ ...dynamicStyleVariables, binHexColors });
  };
  const setBins = (bins: any) => {
    setDynamicStyleVariables({ ...dynamicStyleVariables, bins });
  };

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

  const optionsForChangeMaps = [
    { label: "Original", value: "original" },
    { label: "With Baseline", value: "withBaseline" },
    { label: "All absolute", value: "allAbsolute" },
  ];
  const defaultValueForChangeMapsOptions = optionsForChangeMaps[0];

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

  const versionsOfSelectedDataset = useMemo(
    () => getVersionsOfDataset(datasets, selectedDataset),
    [datasets, selectedDataset],
  );

  const canCompareVersions = versionsOfSelectedDataset.length > 1;

  const buildVersionOptions = useCallback(
    (excluded?: types.Map) =>
      versionsOfSelectedDataset
        .filter((map) => map.mapVersion !== excluded?.mapVersion)
        .map((map) => ({ value: map.mapVersion, label: getVersionLabel(map) })),
    [versionsOfSelectedDataset],
  );

  // Re-resolving each side against the current version list is what makes a
  // mid-value-method change move both sides too. Resolving to the identical entry
  // is a no-op, so this settles after one pass instead of looping.
  useEffect(() => {
    if (!isVersionComparisonActive) {
      return;
    }
    const pair = getDefaultVersionPair(versionsOfSelectedDataset, selectedDataset);
    if (!pair) {
      setIsVersionComparisonActive(false);
      setVersionBefore(undefined);
      setVersionAfter(undefined);
      return;
    }
    const resolve = (map?: types.Map) =>
      map && map.dataset.id === selectedDataset?.dataset.id
        ? versionsOfSelectedDataset.find(({ mapVersion }) => mapVersion === map.mapVersion)
        : undefined;
    const nextBefore = resolve(versionBefore) ?? pair.before;
    const nextAfter = resolve(versionAfter) ?? pair.after;
    if (nextBefore !== versionBefore) {
      setVersionBefore(nextBefore);
    }
    if (nextAfter !== versionAfter) {
      setVersionAfter(nextAfter);
    }
  }, [
    isVersionComparisonActive,
    versionsOfSelectedDataset,
    selectedDataset,
    versionBefore,
    versionAfter,
    setIsVersionComparisonActive,
    setVersionBefore,
    setVersionAfter,
  ]);

  const onToggleVersionComparison = (checked: boolean) => {
    setIsVersionComparisonActive(checked);
    if (!checked) {
      setVersionBefore(undefined);
      setVersionAfter(undefined);
    }
  };

  const onVersionChange =
    (side: "before" | "after") => (option: { label: string; value: string | number }) => {
      const map = versionsOfSelectedDataset.find(
        ({ mapVersion }) => mapVersion === Number(option.value),
      );
      if (!map) {
        return;
      }
      if (side === "before") {
        setVersionBefore(map);
      } else {
        setVersionAfter(map);
      }
    };

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
    }
    setChangeMapDisplayOption("original");
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

  const onChangeAbsoluteClicked = (option: { label: string; value: string }) => {
    if (!selectedDataset) {
      return;
    }
    let newDataset: types.Map | undefined;
    if (option.value === "allAbsolute") {
      newDataset = datasets.find(
        (dataset) => dataset.mapVersion === 5 && dataset.dataset.id === selectedDataset.dataset.id,
      );
    } else if (option.value === "withBaseline") {
      newDataset = datasets.find(
        (dataset) => dataset.mapVersion === 4 && dataset.dataset.id === selectedDataset.dataset.id,
      );
    } else {
      newDataset = datasets.find(
        (dataset) => dataset.mapVersion === 3 && dataset.dataset.id === selectedDataset.dataset.id,
      );
    }
    if (newDataset) {
      setSelectedDataset(newDataset);
    }
    setChangeMapDisplayOption(option.value as ChangeMapDisplayOptionType);
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
      {canCompareVersions && (
        <Section showBorder={false}>
          <Option>
            <SwitchLabel>
              {translate("menu.data.compareVersions", "Compare map versions")}
            </SwitchLabel>
            <CustomSwitch
              name="compare_versions"
              label={translate(
                isVersionComparisonActive ? "menu.mapStyle.on" : "menu.mapStyle.off",
              )}
              checked={isVersionComparisonActive}
              onChange={onToggleVersionComparison}
            />
          </Option>
          {isVersionComparisonActive && versionBefore && versionAfter && (
            <VersionFields>
              <div>
                <Title>{translate("menu.data.versionOnLeft", "Version on the left")}</Title>
                <Dropdown
                  value={{ value: versionBefore.mapVersion, label: getVersionLabel(versionBefore) }}
                  options={buildVersionOptions(versionAfter)}
                  onChange={onVersionChange("before")}
                />
              </div>
              <div>
                <Title>{translate("menu.data.versionOnRight", "Version on the right")}</Title>
                <Dropdown
                  value={{ value: versionAfter.mapVersion, label: getVersionLabel(versionAfter) }}
                  options={buildVersionOptions(versionBefore)}
                  onChange={onVersionChange("after")}
                />
              </div>
              <Hint>
                {translate(
                  "menu.data.compareVersionsHint",
                  "Both sides share the legend bins and colours below, so any difference you see is a difference in the data.",
                )}
              </Hint>
            </VersionFields>
          )}
        </Section>
      )}
      {(selectedDataset?.name.toLowerCase().startsWith("change") || selectedDataset?.isDiff) && (
        <Section showBorder={false}>
          <Title>Change map display option </Title>
          <Dropdown
            value={
              optionsForChangeMaps.find((option) => option.value === changeMapDisplayOption) ||
              defaultValueForChangeMapsOptions
            }
            options={optionsForChangeMaps}
            onChange={onChangeAbsoluteClicked}
          />
        </Section>
      )}
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
