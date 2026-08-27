import { useCallback, useEffect, useMemo } from "react";
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
  ERA5_QUERY_PARAM,
  mapBuilderProjectionNames,
  parseComparisonMode,
  VERSION_AFTER_QUERY_PARAM,
  VERSION_BEFORE_QUERY_PARAM,
} from "../../consts/mapConsts";
import { getQueryParam, setQueryParam } from "../../utils";
import { findMapForSlug } from "../../utils/mapSelection";
import { useTranslation } from "../../contexts/TranslationContext";
import useWPApi from "../../utils/useWPApi";
import {
  getAvailableDiffPairs,
  getDefaultDiffPair,
  getDefaultSwipePair,
  getVersionLabel,
  getVersionsOfDataset,
} from "../../utils/mapVersions";
import { getDiffPairLabel } from "../../consts/versionDiffMaps";
import {
  buildEra5Map,
  ERA5_MAX_DEGREES,
  ERA5_VERSION_QUERY_VALUE,
  getEra5MapForDataset,
  isEra5Map,
} from "../../consts/era5Maps";

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
      degrees,
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
      comparisonRestored,
      versionBefore,
      versionAfter,
      showEra5,
      setComparisonMode,
      setComparisonRestored,
      setVersionBefore,
      setVersionAfter,
      setShowEra5,
    },
    mapStyle: { setDynamicStyleVariables, setMapProjection },
  } = useMenu();

  const { translate, locale } = useTranslation();

  const setColorScheme = (binHexColors: any) => {
    setDynamicStyleVariables((previous) => ({ ...previous, binHexColors }));
  };
  const setBins = (bins: any) => {
    setDynamicStyleVariables((previous) => ({ ...previous, bins }));
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
    setFilterByStatus,
    setMapProjection,
    allowedProjections: mapBuilderProjectionNames,
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

  const datasetOptions = useMemo(() => {
    const optionsBySlug = new Map<string, { label: string; value: string }>();
    datasetsMatchingFilters
      .filter(({ dataset }) =>
        effectiveSubCategory === "all" ? true : dataset.subCategory === effectiveSubCategory,
      )
      .forEach(({ slug, name }) => {
        if (!optionsBySlug.has(slug)) {
          optionsBySlug.set(slug, {
            label: translate(`header.datasets.${camelcase(slug)}`, name),
            value: slug,
          });
        }
      });
    return [...optionsBySlug.values()];
  }, [datasetsMatchingFilters, effectiveSubCategory, translate]);
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

  const era5Entry = useMemo(
    () => getEra5MapForDataset(selectedDataset?.dataset.id),
    [selectedDataset],
  );

  const hasEra5 = !!era5Entry;

  /**
   * Memoized so an ERA5 comparison side is the same object across renders. The
   * reconcile effect below settles by identity, and a fresh object each pass
   * would make it loop forever.
   */
  const era5Map = useMemo(
    () => (selectedDataset && era5Entry ? buildEra5Map(selectedDataset, era5Entry) : undefined),
    [selectedDataset, era5Entry],
  );

  // ERA5 gives a dataset something to compare against even when it has a single
  // version, so the side-by-side gate is wider than the version-picker one.
  const canCompare = canCompareVersions || hasEra5;

  const era5VersionLabel = translate("menu.data.era5VersionLabel", "ERA5 (observed)");

  const buildVersionOptions = useCallback(
    (excluded?: types.Map) => {
      const options: { value: string | number; label: string }[] = versionsOfSelectedDataset
        .filter((map) => map.mapVersion !== excluded?.mapVersion)
        .map((map) => ({ value: map.mapVersion, label: getVersionLabel(map) }));
      if (hasEra5 && !isEra5Map(excluded)) {
        options.push({ value: ERA5_VERSION_QUERY_VALUE, label: era5VersionLabel });
      }
      return options;
    },
    [versionsOfSelectedDataset, hasEra5, era5VersionLabel],
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

    const pair = getDefaultSwipePair(versionsOfSelectedDataset, selectedDataset, era5Map);
    if (!pair) {
      setComparisonMode("none");
      setVersionBefore(undefined);
      setVersionAfter(undefined);
      return;
    }
    // An ERA5 side has no row to re-find, so it resolves to the memoized
    // synthetic map instead — which also drops it if the new dataset has no
    // ERA5, falling the side back onto `pair`.
    const resolve = (map?: types.Map) => {
      if (isEra5Map(map)) {
        return era5Map;
      }
      return map && map.dataset.id === selectedDataset?.dataset.id
        ? versionsOfSelectedDataset.find(({ mapVersion }) => mapVersion === map.mapVersion)
        : undefined;
    };
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
    era5Map,
    setComparisonMode,
    setVersionBefore,
    setVersionAfter,
  ]);

  useEffect(() => {
    if (comparisonRestored || datasets.length === 0) {
      return;
    }
    setComparisonRestored(true);

    const mode = parseComparisonMode(getQueryParam(COMPARE_MODE_QUERY_PARAM));
    if (!mode) {
      // ERA5 is a property of the main map, so it only survives the round trip
      // while no comparison is open.
      const wantsEra5 = getQueryParam(ERA5_QUERY_PARAM) === "1" && hasEra5;
      setShowEra5(wantsEra5);
      setQueryParam({ comparisonMode: "none", showEra5: wantsEra5 });
      return;
    }
    const findVersion = (param: string) => {
      const value = getQueryParam(param);
      if (!value) {
        return undefined;
      }
      return value === ERA5_VERSION_QUERY_VALUE
        ? era5Map
        : versionsOfSelectedDataset.find(({ mapVersion }) => mapVersion === Number(value));
    };
    const before = findVersion(VERSION_BEFORE_QUERY_PARAM);
    const after = findVersion(VERSION_AFTER_QUERY_PARAM);
    const linked =
      before && after && before.mapVersion !== after.mapVersion ? { before, after } : undefined;
    // Resolved here rather than left to the effect above so the mode and both
    // versions land together: the map reads them to pick the style it is created
    // with, and a style swapped in a render later is dropped by Mapbox while the
    // first one is still loading.
    const pair =
      mode === "diff"
        ? getDefaultDiffPair(
            versionsOfSelectedDataset,
            selectedDataset?.dataset.id,
            linked?.before,
            linked?.after,
          )
        : linked ?? getDefaultSwipePair(versionsOfSelectedDataset, selectedDataset, era5Map);
    if (!pair) {
      setQueryParam({ comparisonMode: "none" });
      return;
    }
    setVersionBefore(pair.before);
    setVersionAfter(pair.after);
    setComparisonMode(mode);
    // Clamped here as well as in the map so a shared ERA5 link opens coherent:
    // the map reads `degrees` on its first paint, and the url should not go on
    // claiming a level the tiles have no data for.
    if ((isEra5Map(pair.before) || isEra5Map(pair.after)) && degrees > ERA5_MAX_DEGREES) {
      setDegrees(ERA5_MAX_DEGREES);
      setQueryParam({ warmingScenario: ERA5_MAX_DEGREES });
    }
  }, [
    datasets,
    versionsOfSelectedDataset,
    selectedDataset,
    comparisonRestored,
    era5Map,
    hasEra5,
    degrees,
    setComparisonRestored,
    setComparisonMode,
    setVersionBefore,
    setVersionAfter,
    setShowEra5,
    setDegrees,
  ]);

  useEffect(() => {
    if (!comparisonRestored) {
      return;
    }
    const serializeSide = (map?: types.Map) =>
      map && (isEra5Map(map) ? ERA5_VERSION_QUERY_VALUE : map.mapVersion);
    setQueryParam({
      comparisonMode,
      versionBefore: serializeSide(versionBefore),
      versionAfter: serializeSide(versionAfter),
      showEra5: comparisonMode === "none" && showEra5,
    });
  }, [comparisonRestored, comparisonMode, versionBefore, versionAfter, showEra5]);

  // A dataset without ERA5 cannot show it, and neither can a comparison — each
  // side carries its own style there.
  useEffect(() => {
    if (showEra5 && (!hasEra5 || comparisonMode !== "none")) {
      setShowEra5(false);
    }
  }, [showEra5, hasEra5, comparisonMode, setShowEra5]);

  const comparisonSegments: Segment<ComparisonMode>[] = [
    { value: "none", label: translate("menu.data.comparisonModes.none", "Off") },
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

  /** Matches the option built by `buildVersionOptions`, so the dropdown shows a selection. */
  const versionOption = (map: types.Map) =>
    isEra5Map(map)
      ? { value: ERA5_VERSION_QUERY_VALUE, label: era5VersionLabel }
      : { value: map.mapVersion, label: getVersionLabel(map) };

  const mapSourceSegments: Segment<"model" | "era5">[] = [
    { value: "model", label: translate("menu.data.mapSourceOptions.model", "Model") },
    { value: "era5", label: translate("menu.data.mapSourceOptions.era5", "Observations (ERA5)") },
  ];

  const onDiffPairChange = (option: { label: string; value: string | number }) => {
    const pair = diffPairs.find(({ diffMap }) => diffMap.mapStyleId === option.value);
    if (pair) {
      setVersionBefore(pair.before);
      setVersionAfter(pair.after);
    }
  };

  const onVersionChange =
    (side: "before" | "after") => (option: { label: string; value: string | number }) => {
      const map =
        option.value === ERA5_VERSION_QUERY_VALUE
          ? era5Map
          : versionsOfSelectedDataset.find(({ mapVersion }) => mapVersion === Number(option.value));
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
      finalDataset = findMapForSlug(datasets, {
        slug: option.value as string,
        status: filterByStatus,
      });
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
    setQueryParam({ status: option.value as string });
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
      {hasEra5 && comparisonMode === "none" && (
        <Section showBorder={false}>
          <Title>{translate("menu.data.mapSource", "Map source")}</Title>
          <SegmentedControl
            name={translate("menu.data.mapSource", "Map source")}
            value={showEra5 ? "era5" : "model"}
            segments={mapSourceSegments}
            onChange={(value) => setShowEra5(value === "era5")}
            orientation="vertical"
          />
          {showEra5 && (
            <Hint>
              {translate(
                "menu.data.era5Hint",
                "ERA5 is reanalysis — observations gridded into a best estimate of what actually happened. It only reaches the 0.5°C and 1°C warming levels, and has no data for Antarctica.",
              )}
            </Hint>
          )}
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
      {canCompare && (
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
                  value={versionOption(versionBefore)}
                  options={buildVersionOptions(versionAfter)}
                  onChange={onVersionChange("before")}
                />
              </div>
              <div>
                <Title>{translate("menu.data.versionOnRight", "Version on the right")}</Title>
                <Dropdown
                  value={versionOption(versionAfter)}
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
              {(isEra5Map(versionBefore) || isEra5Map(versionAfter)) && (
                <Hint>
                  {translate(
                    "menu.data.era5Hint",
                    "ERA5 is reanalysis — observations gridded into a best estimate of what actually happened. It only reaches the 0.5°C and 1°C warming levels, and has no data for Antarctica.",
                  )}
                </Hint>
              )}
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
