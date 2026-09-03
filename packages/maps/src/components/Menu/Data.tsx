import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { types } from "@probable-futures/lib";
import camelcase from "lodash.camelcase";

import Dropdown from "../common/Dropdown";
import CustomSwitch from "../common/CustomSwitch";
import SegmentedControl, { Segment } from "../common/SegmentedControl";
import { useMenu } from "../../components/Menu";
import { dividerColor, Section, SIDEBAR_GUTTER, Title } from "./Menu.styled";
import useMapsApi from "../../utils/useMapsApi";
import { colors } from "../../consts";
import { ReactComponent as CaretRightIcon } from "../../assets/icons/caret-right.svg";
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
import { findMapForSlug, isChangeMap } from "../../utils/mapSelection";
import {
  areComparable,
  canRenderAbsolute,
  getMapValueMode,
  resolveChangeView,
} from "../../utils/mapValueMode";
import { useTranslation } from "../../contexts/TranslationContext";
import useWPApi from "../../utils/useWPApi";
import {
  getAvailableDiffPairs,
  getDefaultDiffPair,
  getDefaultSwipePair,
  getVersionLabel,
  getVersionSourceLabel,
  getVersionsOfDataset,
} from "../../utils/mapVersions";
import { getDiffPairLabel } from "../../consts/versionDiffMaps";
import {
  buildEra5Map,
  ERA5_LABEL,
  ERA5_MAX_DEGREES,
  ERA5_VERSION_QUERY_VALUE,
  getEra5MapForDataset,
  isEra5Map,
} from "../../consts/era5Maps";

const FILTERS_CONTENT_ID = "map-builder-data-filters";
const FILTERS_TRANSITION_MS = 300;
const GUIDE_MORE_ID = "map-builder-data-guide-more";

const RECESSED_BACKGROUND = "#e7e7e7";

const LEADING_VERSION_COUNT = 2;

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

const FiltersArea = styled.div`
  background-color: ${RECESSED_BACKGROUND};
  border-bottom: 2px solid ${dividerColor};
`;

const FiltersToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 12px ${SIDEBAR_GUTTER}px;
  border: none;
  background-color: transparent;
  color: ${colors.lightGrey2};
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  line-height: 1.15;
  text-align: left;
  text-transform: uppercase;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: rgba(42, 23, 45, 0.05);
    color: ${colors.darkPurple};
  }

  &:focus-visible {
    outline: 2px solid ${colors.purple};
    outline-offset: -2px;
  }
`;

const ToggleCaret = styled.i`
  display: inline-flex;
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  transition: transform 0.25s ease;
  transform: ${({ expanded }: { expanded: boolean }) => (expanded ? "rotate(90deg)" : "rotate(0)")};

  svg {
    width: 12px;
    height: 12px;

    path {
      fill: currentColor;
    }
  }
`;

const ActiveFilterCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  margin-left: auto;
  padding: 0 4px;
  box-sizing: border-box;
  border-radius: 8px;
  background-color: ${colors.purple};
  color: ${colors.white};
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0;
`;

/* Reference, not chrome: sized down and set apart so it does not compete with the
   controls above it. */
const GuideList = styled.ul`
  margin: 0;
  padding-left: 16px;
  color: ${colors.lightGrey2};
  font-size: 12px;
  letter-spacing: 0;
  line-height: 16px;

  li + li {
    margin-top: 6px;
  }
`;

const InlineTextButton = styled.button`
  align-self: flex-start;
  margin-top: 8px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: ${colors.lightGrey2};
  font-family: inherit;
  font-size: 12px;
  letter-spacing: 0;
  line-height: 1.3;
  text-decoration: underline;

  &:hover {
    color: ${colors.purple};
  }

  &:focus-visible {
    outline: 2px solid ${colors.purple};
    outline-offset: 2px;
  }
`;

type FiltersContentProps = {
  expanded: boolean;
  settled: boolean;
};

const FiltersContent = styled.div`
  overflow: ${({ settled }: FiltersContentProps) => (settled ? "visible" : "hidden")};
  max-height: ${({ expanded }: FiltersContentProps) => (expanded ? "500px" : "0")};
  opacity: ${({ expanded }: FiltersContentProps) => (expanded ? 1 : 0)};
  visibility: ${({ expanded }: FiltersContentProps) => (expanded ? "visible" : "hidden")};
  transition: max-height ${FILTERS_TRANSITION_MS}ms ease, opacity ${FILTERS_TRANSITION_MS}ms ease,
    visibility 0s
      ${({ expanded }: FiltersContentProps) => (expanded ? "0s" : `${FILTERS_TRANSITION_MS}ms`)};
`;

export default function Data(): JSX.Element {
  const {
    data: {
      selectedDataset,
      datasets,
      filterByStatus,
      filterByCategory,
      showInspector,
      degrees,
      setSelectedDataset,
      setFilterByStatus,
      setFilterByCategory,
      setShowInspector,
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
      showAbsolute,
      setShowAbsolute,
      setShowCoverage,
      setComparisonMode,
      setComparisonRestored,
      setVersionBefore,
      setVersionAfter,
      setShowEra5,
    },
    mapStyle: { setDynamicStyleVariables, setMapProjection },
  } = useMenu();

  const { translate, locale } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [filtersSettled, setFiltersSettled] = useState(false);
  const [showOlderVersions, setShowOlderVersions] = useState(false);
  const [showFullGuide, setShowFullGuide] = useState(false);

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

  /**
   * The sides that may be set opposite `excluded`. Both must render the same kind
   * of value, so a change version cannot be laid against ERA5 unless an absolute
   * rendering of it exists — see `areComparable`.
   */
  const buildVersionOptions = useCallback(
    (excluded?: types.Map) => {
      const options: { value: string | number; label: string }[] = versionsOfSelectedDataset
        .filter((map) => map.mapVersion !== excluded?.mapVersion)
        .filter((map) => !excluded || areComparable(map, excluded))
        .map((map) => ({ value: map.mapVersion, label: getVersionLabel(map) }));
      if (hasEra5 && !isEra5Map(excluded) && canRenderAbsolute(excluded)) {
        options.push({ value: ERA5_VERSION_QUERY_VALUE, label: ERA5_LABEL });
      }
      return options;
    },
    [versionsOfSelectedDataset, hasEra5],
  );

  const diffPairs = useMemo(
    () => getAvailableDiffPairs(versionsOfSelectedDataset, selectedDataset?.dataset.id),
    [versionsOfSelectedDataset, selectedDataset],
  );

  const canShowDiff = diffPairs.length > 0;

  useEffect(() => {
    if (!showFilters) {
      setFiltersSettled(false);
      return;
    }
    const timer = setTimeout(() => setFiltersSettled(true), FILTERS_TRANSITION_MS);
    return () => clearTimeout(timer);
  }, [showFilters]);

  const activeFilterCount = [filterByStatus, filterByCategory, effectiveSubCategory].filter(
    (value) => value !== "all",
  ).length;

  const activeDiffPair = useMemo(
    () =>
      diffPairs.find(
        ({ diffMap }) =>
          diffMap.baseVersion === versionBefore?.mapVersion &&
          diffMap.targetVersion === versionAfter?.mapVersion,
      ),
    [diffPairs, versionBefore, versionAfter],
  );

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
    const resolvedBefore = resolve(versionBefore) ?? pair.before;
    const resolvedAfter = resolve(versionAfter) ?? pair.after;
    const [nextBefore, nextAfter] = areComparable(resolvedBefore, resolvedAfter)
      ? [resolvedBefore, resolvedAfter]
      : [pair.before, pair.after];
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
      before && after && before.mapVersion !== after.mapVersion && areComparable(before, after)
        ? { before, after }
        : undefined;
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

  // Only some change maps have an absolute rendering published, and only for some
  // versions, so the option is gated on the registry rather than on the dataset.

  const changeView = resolveChangeView({
    comparisonMode,
    selectedDataset,
    versionBefore,
    versionAfter,
    showEra5,
    showAbsolute,
  });

  useEffect(() => {
    if (showAbsolute && !changeView.canAbsolute) {
      setShowAbsolute(false);
    }
  }, [showAbsolute, changeView.canAbsolute, setShowAbsolute]);

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
      ? { value: ERA5_VERSION_QUERY_VALUE, label: ERA5_LABEL }
      : { value: map.mapVersion, label: getVersionLabel(map) };

  const leadingVersions = versionsOfSelectedDataset.slice(-LEADING_VERSION_COUNT);
  const olderVersions = versionsOfSelectedDataset.slice(0, -LEADING_VERSION_COUNT);
  const selectedSourceValue = showEra5
    ? ERA5_VERSION_QUERY_VALUE
    : String(selectedDataset?.mapVersion ?? "");
  const selectedIsOlderVersion =
    !showEra5 && olderVersions.some(({ mapVersion }) => String(mapVersion) === selectedSourceValue);
  const olderVersionsVisible = showOlderVersions || selectedIsOlderVersion;

  const versionSegment = (map: types.Map): Segment<string> => ({
    value: String(map.mapVersion),
    label: getVersionSourceLabel(map),
  });

  // A difference map was built from the change values, which is not obvious from
  // the locked control alone.
  const changeViewHint =
    comparisonMode === "diff"
      ? translate(
          "menu.data.changeViewDiffLocked",
          "Difference maps were built from the change values, so the view is fixed.",
        )
      : changeView.canAbsolute
      ? undefined
      : translate(
          "menu.data.changeViewHint",
          "No absolute rendering has been published for every version shown.",
        );

  const changeViewSegments: Segment<"change" | "absolute">[] = [
    {
      value: "change",
      label: translate("menu.data.changeViewOptions.change", "Change"),
      disabled: !changeView.canChange,
    },
    {
      value: "absolute",
      label: translate("menu.data.changeViewOptions.absolute", "Absolute"),
      disabled: !changeView.canAbsolute,
    },
  ];

  const mapSourceSegments: Segment<string>[] = [
    ...leadingVersions.map(versionSegment),
    ...(hasEra5 ? [{ value: ERA5_VERSION_QUERY_VALUE, label: ERA5_LABEL }] : []),
    ...(olderVersionsVisible ? olderVersions.map(versionSegment) : []),
  ];

  const onMapSourceChange = (value: string) => {
    if (value === ERA5_VERSION_QUERY_VALUE) {
      setShowEra5(true);
      return;
    }
    const map = versionsOfSelectedDataset.find(({ mapVersion }) => String(mapVersion) === value);
    if (map) {
      setShowEra5(false);
      setSelectedDataset(map);
    }
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

  return (
    <Container>
      <FiltersArea>
        <FiltersToggle
          type="button"
          aria-expanded={showFilters}
          aria-controls={FILTERS_CONTENT_ID}
          onClick={() => setShowFilters((shown) => !shown)}
        >
          <ToggleCaret expanded={showFilters} aria-hidden="true">
            <CaretRightIcon />
          </ToggleCaret>
          {showFilters
            ? translate("menu.data.hideFilters", "Hide filters")
            : translate("menu.data.showFilters", "Show filters")}
          {!showFilters && activeFilterCount > 0 && (
            <ActiveFilterCount>{activeFilterCount}</ActiveFilterCount>
          )}
        </FiltersToggle>
        <FiltersContent id={FILTERS_CONTENT_ID} expanded={showFilters} settled={filtersSettled}>
          <Section showBorder={false}>
            <Title>{translate("menu.data.mapStatus")}</Title>
            <Dropdown
              value={
                filterOptions.find((option) => option.value === filterByStatus) || defaultValue
              }
              options={filterOptions}
              onChange={onFilterChange}
            />
          </Section>
          <Section showBorder={false}>
            <Title>{translate("menu.data.volume", "Map category")}</Title>
            <Dropdown
              value={
                volumeOptions.find((option) => option.value === filterByCategory) || defaultValue
              }
              options={volumeOptions}
              onChange={onCategoryChange}
            />
          </Section>
          {subCategoryOptions.length > 1 && (
            <Section showBorder={false}>
              <Title>{translate("menu.data.subCategory", "Map subcategory")}</Title>
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
        </FiltersContent>
      </FiltersArea>
      <Section showBorder={false}>
        <Title>{translate("menu.data.dataSet", "Select a map")}</Title>
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
      {selectedDataset && (
        <Section showBorder={false}>
          <Title>{translate("menu.data.dataGuide.title", "What this data is")}</Title>
          <GuideList id={GUIDE_MORE_ID}>
            <li>
              {translate(
                "menu.data.dataGuide.absolute",
                "Absolute maps show a value. Every warming scenario applies, 0.5°C included.",
              )}
            </li>
            <li>
              {translate(
                "menu.data.dataGuide.change",
                "Change maps show the difference from 0.5°C, so they start at 1°C.",
              )}
            </li>
            <li>
              {translate(
                "menu.data.dataGuide.changeView",
                "Change view switches the same map between the difference and the actual values.",
              )}
            </li>
            <li>
              {translate(
                "menu.data.dataGuide.era5",
                "ERA5 is observed reanalysis. Always absolute, and only reaches 0.5°C and 1°C.",
              )}
            </li>
            <li>
              {translate(
                "menu.data.dataGuide.compare",
                "Side by side needs both maps to be the same kind. Incompatible versions are hidden.",
              )}
            </li>
            {showFullGuide && (
              <>
                <li>
                  {translate(
                    "menu.data.dataGuide.era5Pairing",
                    "A change map can pair with ERA5 only when it has an absolute version.",
                  )}
                </li>
                <li>
                  {translate(
                    "menu.data.dataGuide.diff",
                    "Difference maps are built from the change values, so their view is fixed.",
                  )}
                </li>
                <li>
                  {translate(
                    "menu.data.dataGuide.availability",
                    "Absolute versions are published per map and per version, so the option is not always there.",
                  )}
                </li>
              </>
            )}
          </GuideList>
          <InlineTextButton
            type="button"
            aria-expanded={showFullGuide}
            aria-controls={GUIDE_MORE_ID}
            onClick={() => setShowFullGuide((shown) => !shown)}
          >
            {showFullGuide
              ? translate("menu.data.dataGuide.less", "Read less")
              : translate("menu.data.dataGuide.more", "Read more")}
          </InlineTextButton>
          <InlineTextButton type="button" onClick={() => setShowCoverage(true)}>
            {translate("menu.data.coverage.link", "See what's available")}
          </InlineTextButton>
        </Section>
      )}
      {selectedDataset && comparisonMode === "none" && (canCompareVersions || hasEra5) && (
        <Section showBorder={false}>
          <Title>{translate("menu.data.mapSource", "Map source")}</Title>
          <SegmentedControl
            name={translate("menu.data.mapSource", "Map source")}
            value={selectedSourceValue}
            segments={mapSourceSegments}
            onChange={onMapSourceChange}
            orientation="vertical"
          />
          {olderVersions.length > 0 && !selectedIsOlderVersion && (
            <InlineTextButton type="button" onClick={() => setShowOlderVersions((shown) => !shown)}>
              {olderVersionsVisible
                ? translate("menu.data.showFewerVersions", "Show fewer")
                : translate("menu.data.showMoreVersions", "Show more")}
            </InlineTextButton>
          )}
        </Section>
      )}
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
      {isChangeMap(selectedDataset) && (
        <Section showBorder={false}>
          <Title>{translate("menu.data.changeView", "Change view")}</Title>
          <SegmentedControl
            name={translate("menu.data.changeView", "Change view")}
            value={changeView.mode}
            segments={changeViewSegments}
            onChange={(value) => {
              if (!changeView.locked) {
                setShowAbsolute(value === "absolute");
              }
            }}
            orientation="vertical"
          />
          {changeViewHint && <Hint>{changeViewHint}</Hint>}
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
    </Container>
  );
}
