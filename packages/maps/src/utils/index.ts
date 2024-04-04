import {
  MAP_PROJECTION_QUERY_PARAM,
  MAP_QUERY_PARAM,
  MAP_VERSION_QUERY_PARAM,
  WARMING_SCENARIO_QUERY_PARAM,
} from "../consts/mapConsts";

type SetQueryParam = {
  mapSlug?: string;
  warmingScenario?: number;
  version?: string;
  mapProjection?: string;
};

export const setQueryParam = ({
  mapSlug,
  warmingScenario,
  version,
  mapProjection,
}: SetQueryParam) => {
  const params = new window.URLSearchParams(window.location.search);

  if (mapSlug !== null && mapSlug !== undefined) {
    params.set(MAP_QUERY_PARAM, mapSlug);
  }
  if (version !== null && version !== undefined) {
    params.set(MAP_VERSION_QUERY_PARAM, version);
  }
  if (warmingScenario !== null && warmingScenario !== undefined) {
    params.set(WARMING_SCENARIO_QUERY_PARAM, warmingScenario.toString());
  }
  if (mapProjection !== null && mapProjection !== undefined) {
    params.set(MAP_PROJECTION_QUERY_PARAM, mapProjection);
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
