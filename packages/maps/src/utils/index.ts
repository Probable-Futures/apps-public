import { PopupFeature } from "@probable-futures/lib";
import {
  MAP_PROJECTION_QUERY_PARAM,
  MAP_QUERY_PARAM,
  MAP_VERSION_QUERY_PARAM,
  SCENARIO_AFTER_QUERY_PARAM,
  SCENARIO_BEFORE_QUERY_PARAM,
  WARMING_SCENARIO_QUERY_PARAM,
} from "../consts/mapConsts";

type SetQueryParam = {
  mapSlug?: string;
  warmingScenario?: number;
  version?: string;
  mapProjection?: string;
  isComparisonMapActive?: boolean;
  comparisonScenarioBefore?: number;
  comparisonScenarioAfter?: number;
};

export const setQueryParam = ({
  mapSlug,
  warmingScenario,
  version,
  mapProjection,
  isComparisonMapActive,
  comparisonScenarioBefore,
  comparisonScenarioAfter,
}: SetQueryParam) => {
  const params = new window.URLSearchParams(window.location.search);

  if (mapSlug !== null && mapSlug !== undefined) {
    params.set(MAP_QUERY_PARAM, mapSlug);
  }
  if (version !== null && version !== undefined) {
    params.set(MAP_VERSION_QUERY_PARAM, version);
  }
  if (mapProjection !== null && mapProjection !== undefined) {
    params.set(MAP_PROJECTION_QUERY_PARAM, mapProjection);
  }

  if (isComparisonMapActive === true) {
    params.delete(WARMING_SCENARIO_QUERY_PARAM);
    if (comparisonScenarioBefore !== undefined && comparisonScenarioBefore !== null) {
      params.set(SCENARIO_BEFORE_QUERY_PARAM, comparisonScenarioBefore.toString());
    }
    if (comparisonScenarioAfter !== undefined && comparisonScenarioAfter !== null) {
      params.set(SCENARIO_AFTER_QUERY_PARAM, comparisonScenarioAfter.toString());
    }
  } else if (isComparisonMapActive === false) {
    params.delete(SCENARIO_BEFORE_QUERY_PARAM);
    params.delete(SCENARIO_AFTER_QUERY_PARAM);
    if (warmingScenario !== null && warmingScenario !== undefined) {
      params.set(WARMING_SCENARIO_QUERY_PARAM, warmingScenario.toString());
    }
  } else if (warmingScenario !== null && warmingScenario !== undefined) {
    params.set(WARMING_SCENARIO_QUERY_PARAM, warmingScenario.toString());
  }

  window.history.replaceState(null, "", `?${params.toString()}${window.location.hash}`);
};

/**
 * function to delete query param and update url
 * @param param
 */
export const deleteQueryParam = (param: string) => {
  const queryParams = new window.URLSearchParams(window.location.search);
  if (queryParams.has(param)) {
    queryParams.delete(param);
    window.history.replaceState(
      null,
      "",
      `?${queryParams.toString()}${window.localStorage.hash || ""}`,
    );
  }
};

/**
 *
 * @param newParam
 * @param oldParam
 * @returns the value of the param extracted from either the old or the new param name
 */
export const getQueryParam = (newParam: string, oldParam?: string) => {
  const newParamValue = new window.URLSearchParams(window.location.search).get(newParam);
  let oldParamValue = "";
  if (oldParam) {
    oldParamValue = new window.URLSearchParams(window.location.search).get(oldParam) || "";
    deleteQueryParam(oldParam);
  }

  return newParamValue || oldParamValue;
};

export const getDataByKey = <T extends PopupFeature, U extends keyof T>(feature: T, key: U) =>
  feature ? feature[key] : undefined;
