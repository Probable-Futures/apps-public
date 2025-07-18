import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import MapboxClient from "@mapbox/mapbox-sdk/lib/client";
import mbxGeocoder from "@mapbox/mapbox-sdk/services/geocoding";
import debounce from "lodash.debounce";

import { exceptions, setupConfig, RecentlySearchedItemsKey } from "@probable-futures/lib";
import { GeocoderProps, RecentlySearchedItemType } from "../components/Geocoder";

export type MapboxOutput = {
  attribution: string;
  features: Feature[];
  query: [];
};

export interface Feature extends GeoJSON.Feature<GeoJSON.Point> {
  bbox: [number, number, number, number];
  center: number[][];
  place_name: string;
  place_type: string[];
  relevance: number;
  text: string;
  address: string;
  context: any[];
}

const options = {
  minLength: 2,
  limit: 5,
  debounceTime: 300,
  recentHistoryLimit: 3,
  origin: "https://api.mapbox.com",
  defaultZoom: 10, //  The zoom level that the map should animate to when a `bbox` isn't found in the response. If a `bbox` is found the map will fit to the `bbox`
};

const useGeocoder = (props: GeocoderProps) => {
  const [suggestionList, setSuggestionList] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [geocodeSerice, setGeocodeService] = useState<any>();
  const [showNoResultsMessage, setShowNoResultsMessage] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { onFly, mapRef } = props;

  const onSearch = useCallback(
    async (query: string) => {
      if (!geocodeSerice) {
        return;
      }
      if (query.trim().length >= options.minLength) {
        try {
          setIsLoading(true);
          setError("");
          setShowNoResultsMessage(false);
          const config = setupConfig(query, options.limit, props.language);
          const response = await geocodeSerice.forwardGeocode(config).send();
          const body: MapboxOutput = response.body;
          const features = body.features;
          if (features.length === 0) {
            setShowNoResultsMessage(true);
          }
          setSuggestionList(features);
          setIsLoading(false);
          return features;
        } catch (e: any) {
          setError(e.message ?? "Error occured");
          setIsLoading(false);
          setShowNoResultsMessage(true);
          throw e;
        }
      }
      setSuggestionList([]);
      return [];
    },
    [geocodeSerice, props.language],
  );

  const debouncedSearch = useMemo(
    () => debounce(async (query) => await onSearch(query), options.debounceTime),
    [onSearch],
  );

  //https://github.com/mapbox/mapbox-gl-geocoder/blob/main/lib/exceptions.js
  const fly = useCallback(
    (feature: Feature) => {
      const map = mapRef.current;
      if (!map?.flyTo && !map?.fitBounds) {
        if (onFly) {
          return onFly(feature);
        }
        return;
      }
      const shortCode = (
        feature.properties?.short_code === "string" ? feature.properties?.short_code : ""
      ) as keyof typeof exceptions;
      if (exceptions[shortCode]) {
        if (map) {
          // @ts-ignore
          map.fitBounds(exceptions[shortCode].bbox, {});
        }
      } else if (feature.bbox) {
        const bbox = feature.bbox;
        if (map) {
          map.fitBounds(
            [
              [bbox[0], bbox[1]],
              [bbox[2], bbox[3]],
            ],
            {},
          );
        }
      } else {
        let flyOptions: { center?: number[][] | number[] | any; zoom?: number } = {
          zoom: options.defaultZoom,
        };
        if (feature.center) {
          flyOptions.center = feature.center;
        } else if (
          feature.geometry &&
          feature.geometry.type &&
          feature.geometry.type === "Point" &&
          feature.geometry.coordinates
        ) {
          flyOptions.center = feature.geometry.coordinates;
        }

        if (map) {
          map.flyTo(flyOptions);
        }
      }
      if (onFly) {
        onFly(feature);
      }
    },
    [mapRef, onFly],
  );

  const onClear = useCallback((close = false) => {
    setInputValue("");
    setSuggestionList([]);
    setError("");
    setShowNoResultsMessage(false);
    if (inputRef.current && !close) {
      inputRef.current.focus();
    } else {
      setIsInputFocused(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    if (!geocodeSerice && props.mapboxAccessToken) {
      setGeocodeService(
        mbxGeocoder(
          MapboxClient({
            accessToken: props.mapboxAccessToken,
            origin: options.origin,
          }),
        ),
      );
    }
  }, [geocodeSerice, props.mapboxAccessToken]);

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(event.target.value);
    if (value === "") {
      setShowNoResultsMessage(false);
      setError("");
    } else {
      debouncedSearch(event.target.value);
    }
  };

  const onFeatureSelected = useCallback(
    (feature: Feature, recentlySearchedItems: RecentlySearchedItemType[]) => {
      if (!feature.place_name) {
        return;
      }
      const itemFromStorage = recentlySearchedItems.findIndex((item) =>
        typeof item === "string"
          ? feature.place_name === item
          : feature.place_name === item.place_name,
      );
      if (itemFromStorage !== -1) {
        let existingElement = recentlySearchedItems.splice(itemFromStorage, 1)[0];
        // Replace storage item with a Feature object to get rid of old implementation that sets items as strings
        if (typeof existingElement === "string") {
          existingElement = feature;
        }
        recentlySearchedItems.unshift(existingElement);
      } else {
        recentlySearchedItems.unshift(feature);
      }
      if (recentlySearchedItems.length > options.recentHistoryLimit) {
        recentlySearchedItems.pop();
      }
      localStorage.setItem(
        props.localStorageRecentlySearchedIemskey[
          (props.language as keyof RecentlySearchedItemsKey) || "en"
        ],
        JSON.stringify(recentlySearchedItems),
      );

      fly(feature);

      onClear(false);
    },
    [props.localStorageRecentlySearchedIemskey, props.language, fly, onClear],
  );

  const onRecentlySearchedItemClick = async (
    recentlySearchedItems: RecentlySearchedItemType[],
    index: number,
  ) => {
    const query = recentlySearchedItems[index];
    setInputValue(typeof query === "string" ? query : query.text);
    if (typeof query === "string") {
      const features = await onSearch(query);
      if (features && features[0]) {
        onFeatureSelected(features[0], recentlySearchedItems);
      }
    } else {
      onFeatureSelected(query, recentlySearchedItems);
    }
  };

  const onKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    recentlySearchedItems: RecentlySearchedItemType[],
  ) => {
    if (event.code === "Enter" && suggestionList.length > 0) {
      setInputValue(suggestionList[0].place_name);
      onFeatureSelected(suggestionList[0], recentlySearchedItems);
    }
  };

  return {
    suggestionList,
    inputValue,
    isLoading,
    showNoResultsMessage,
    error,
    inputRef,
    isInputFocused,
    onRecentlySearchedItemClick,
    onFeatureSelected,
    onInputChange,
    onClear,
    onKeyDown,
    setIsInputFocused,
  };
};

export default useGeocoder;
