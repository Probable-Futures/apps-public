import { useCallback, useEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";
import camelcase from "lodash.camelcase";

import Dropdown from "../common/Dropdown";
import CustomSwitch from "../common/CustomSwitch";
import SegmentedControl, { Segment } from "../common/SegmentedControl";
import { ChangeMapDisplayOptionType, useMenu } from "../../components/Menu";
import { Section, Title } from "./Menu.styled";
import useMapsApi from "../../utils/useMapsApi";
import { colors } from "../../consts";
import {
  COMPARE_MODE_QUERY_PARAM,
  ComparisonMode,
  parseComparisonMode,
  VERSION_AFTER_QUERY_PARAM,
  VERSION_BEFORE_QUERY_PARAM,
} from "../../consts/mapConsts";
import { getQueryParam, setQueryParam } from "../../utils";
import { useTranslation } from "../../contexts/TranslationContext";
import useWPApi from "../../utils/useWPApi";
import {
  getAvailableDiffPairs,
  getDefaultDiffPair,
  getDefaultVersionPair,
  getVersionLabel,
  getVersionsOfDataset,
} from "../../utils/mapVersions";
import { getDiffPairLabel } from "../../consts/versionDiffMaps";

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
      filterBySubCategory,
      setFilterBySubCategory,
      comparisonMode,
      versionBefore,
      versionAfter,
      setComparisonMode,
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
  const datasetsMatchingFilters = useMemo(
    () =>
      datasets
        .filter(({ isLatest }) => isLatest)
        .filter(({ status }) => (filterByStatus === "all" ? true : status === filterByStatus))
        .filter(({ dataset: { pfDatasetParentCategoryByParentCategory: category } }) =>
          filterByCategory === "all" ? true : category.name === filterByCategory,
        ),
    [datasets, filterByStatus, filterByCategory],
  );

  const subCategoryOptions = useMemo(() => {
    const uniqueSubCategories = [
      ...new Set(
        datasetsMatchingFilters
          .map(({ dataset }) => dataset.subCategory)
          .filter((subCategory): subCategory is string => !!subCategory),
      ),
    ].sort();
    return [
      { label: translate("menu.data.subCategoryOptions.all", "All sub-categories"), value: "all" },
      ...uniqueSubCategories.map((subCategory) => ({ label: subCategory, value: subCategory })),
    ];
  }, [datasetsMatchingFilters, translate]);

  const effectiveSubCategory = useMemo(
    () =>
      subCategoryOptions.some(({ value }) => value === filterBySubCategory)
        ? filterBySubCategory
        : "all",
    [subCategoryOptions, filterBySubCategory],
  );

  const datasetOptions = useMemo(
    () =>
      datasetsMatchingFilters
        .filter(({ dataset }) =>
          effectiveSubCategory === "all" ? true : dataset.subCategory === effectiveSubCategory,
        )
        .map(({ slug, name }) => ({
          label: translate(`header.datasets.${camelcase(slug)}`, name),
          value: slug,
        })),
    [datasetsMatchingFilters, effectiveSubCategory, translate],
  );
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

  const diffPairs = useMemo(
    () => getAvailableDiffPairs(versionsOfSelectedDataset, selectedDataset?.dataset.id),
    [versionsOfSelectedDataset, selectedDataset],
  );

  const canShowDiff = diffPairs.length > 0;

  const activeDiffPair = useMemo(
    () =>
      diffPairs.find(
        ({ diffMap }) =>
          diffMap.baseVersion === versionBefore?.mapVersion &&
          diffMap.targetVersion === versionAfter?.mapVersion,
      ),
    [diffPairs, versionBefore, versionAfter],
  );

  // Re-resolving each side against the current version list is what makes a
  // mid-value-method change move both sides too. Resolving to the identical entry
  // is a no-op, so this settles after one pass instead of looping.
  useEffect(() => {
    if (comparisonMode === "none") {
      return;
    }

    if (comparisonMode === "diff") {
      const pair = getDefaultDiffPair(
        versionsOfSelectedDataset,
        selectedDataset?.dataset.id,
        versionBefore,
        versionAfter,
      );
      if (!pair) {
        setComparisonMode("none");
        setVersionBefore(undefined);
        setVersionAfter(undefined);
        return;
      }
      if (pair.before !== versionBefore) {
        setVersionBefore(pair.before);
      }
      if (pair.after !== versionAfter) {
        setVersionAfter(pair.after);
      }
      return;
    }

    const pair = getDefaultVersionPair(versionsOfSelectedDataset, selectedDataset);
    if (!pair) {
      setComparisonMode("none");
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
    comparisonMode,
    versionsOfSelectedDataset,
    selectedDataset,
    versionBefore,
    versionAfter,
    setComparisonMode,
    setVersionBefore,
    setVersionAfter,
  ]);

  const hasRestoredComparisonFromUrl = useRef(false);
  useEffect(() => {
    if (hasRestoredComparisonFromUrl.current || datasets.length === 0) {
      return;
    }
    hasRestoredComparisonFromUrl.current = true;

    const mode = parseComparisonMode(getQueryParam(COMPARE_MODE_QUERY_PARAM));
    if (!mode) {
      setQueryParam({ comparisonMode: "none" });
      return;
    }
    const findVersion = (param: string) => {
      const value = getQueryParam(param);
      return value
        ? versionsOfSelectedDataset.find(({ mapVersion }) => mapVersion === Number(value))
        : undefined;
    };
    const before = findVersion(VERSION_BEFORE_QUERY_PARAM);
    const after = findVersion(VERSION_AFTER_QUERY_PARAM);
    if (before && after && before.mapVersion !== after.mapVersion) {
      setVersionBefore(before);
      setVersionAfter(after);
    }
    setComparisonMode(mode);
  }, [datasets, versionsOfSelectedDataset, setComparisonMode, setVersionBefore, setVersionAfter]);

  useEffect(() => {
    if (!hasRestoredComparisonFromUrl.current) {
      return;
    }
    setQueryParam({
      comparisonMode,
      versionBefore: versionBefore?.mapVersion,
      versionAfter: versionAfter?.mapVersion,
    });
  }, [comparisonMode, versionBefore, versionAfter]);

  const comparisonSegments: Segment<ComparisonMode>[] = [
    { value: "none", label: translate("menu.data.comparisonModes.none", "Single") },
    { value: "swipe", label: translate("menu.data.comparisonModes.swipe", "Side by side") },
    {
      value: "diff",
      label: translate("menu.data.comparisonModes.diff", "Difference"),
      disabled: !canShowDiff,
      hint: canShowDiff
        ? undefined
        : translate(
            "menu.data.noDiffMapHint",
            "No difference map has been published for this dataset.",
          ),
    },
  ];

  const onComparisonModeChange = (mode: ComparisonMode) => {
    if (mode === "none") {
      setVersionBefore(undefined);
      setVersionAfter(undefined);
    } else if (mode === "diff") {
      const pair = getDefaultDiffPair(
        versionsOfSelectedDataset,
        selectedDataset?.dataset.id,
        versionBefore,
        versionAfter,
      );
      if (!pair) {
        return;
      }
      setVersionBefore(pair.before);
      setVersionAfter(pair.after);
    }
    setComparisonMode(mode);
  };

  const onDiffPairChange = (option: { label: string; value: string | number }) => {
    const pair = diffPairs.find(({ diffMap }) => diffMap.mapStyleId === option.value);
    if (pair) {
      setVersionBefore(pair.before);
      setVersionAfter(pair.after);
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

  const onSelectedVersionChange = (option: { label: string; value: string | number }) => {
    const map = versionsOfSelectedDataset.find(
      ({ mapVersion }) => mapVersion === Number(option.value),
    );
    if (map) {
      setSelectedDataset(map);
    }
  };

  const onFilterChange = (option: { label: String; value: String }) => {
    setFilterByStatus(option.value);
  };

  const onCategoryChange = (option: { label: String; value: String }) => {
    setFilterByCategory(option.value);
    setFilterBySubCategory("all");
  };

  const onSubCategoryChange = (option: { label: String; value: String }) => {
    setFilterBySubCategory(option.value);
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
                  label: translate(
                    `header.datasets.${camelcase(selectedDataset.slug)}`,
                    selectedDataset.name,
                  ),
                }
              : defaultValue
          }
          options={datasetOptions}
          onChange={onDatasetChange}
        />
      </Section>
      {selectedDataset && canCompareVersions && comparisonMode === "none" && (
        <Section showBorder={false}>
          <Title>{translate("menu.data.version", "Version")}</Title>
          <Dropdown
            value={{
              value: selectedDataset.mapVersion,
              label: getVersionLabel(selectedDataset),
            }}
            options={versionsOfSelectedDataset.map((map) => ({
              value: map.mapVersion,
              label: `${getVersionLabel(map)}${map.isLatest ? " · latest" : ""}`,
            }))}
            onChange={onSelectedVersionChange}
          />
        </Section>
      )}
      <Section showBorder={false}>
        <Title>{translate("menu.data.mapStatus")}</Title>
        <Dropdown
          value={filterOptions.find((option) => option.value === filterByStatus) || defaultValue}
          options={filterOptions}
          onChange={onFilterChange}
        />
      </Section>
      <Section showBorder={subCategoryOptions.length <= 1}>
        <Title>{translate("menu.data.volume")}</Title>
        <Dropdown
          value={volumeOptions.find((option) => option.value === filterByCategory) || defaultValue}
          options={volumeOptions}
          onChange={onCategoryChange}
        />
      </Section>
      {subCategoryOptions.length > 1 && (
        <Section>
          <Title>{translate("menu.data.subCategory", "Sub-category")}</Title>
          <Dropdown
            value={
              subCategoryOptions.find((option) => option.value === effectiveSubCategory) ||
              subCategoryOptions[0]
            }
            options={subCategoryOptions}
            onChange={onSubCategoryChange}
          />
        </Section>
      )}
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
          <Title>{translate("menu.data.comparison", "Comparison")}</Title>
          <SegmentedControl
            name={translate("menu.data.comparison", "Comparison")}
            value={comparisonMode}
            segments={comparisonSegments}
            onChange={onComparisonModeChange}
            orientation="vertical"
          />
          {comparisonMode === "swipe" && versionBefore && versionAfter && (
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
          {comparisonMode === "diff" && activeDiffPair && (
            <VersionFields>
              {diffPairs.length > 1 && (
                <div>
                  <Title>{translate("menu.data.differencePair", "Versions compared")}</Title>
                  <Dropdown
                    value={{
                      value: activeDiffPair.diffMap.mapStyleId,
                      label: getDiffPairLabel(activeDiffPair.diffMap),
                    }}
                    options={diffPairs.map(({ diffMap }) => ({
                      value: diffMap.mapStyleId,
                      label: getDiffPairLabel(diffMap),
                    }))}
                    onChange={onDiffPairChange}
                  />
                </div>
              )}
              <Hint>
                {translate(
                  "menu.data.differenceHint",
                  "Red where the newer version is higher than the older one, blue where it is lower. Values are differences, so they are shown in the map's own unit and never converted.",
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
