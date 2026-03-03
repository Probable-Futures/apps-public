export const AnalyticsEvent = {
  ABOUT_MAP_DATA_RESOURCE_CLICKED: "About Map Data Resource Clicked",
  ABOUT_MAP_OPENED: "About Map Opened",
  ABOUT_MAP_RELATED_POST_CLICKED: "About Map Related Post Clicked",
  ABOUT_MAP_RESOURCE_CLICKED: "About Map Resource Clicked",
  COMPARISON_MAP_DOWNLOADED: "Comparison Map Downloaded",
  COUNTRY_BORDERS_TOGGLED: "Country Borders Toggled",
  DOWNLOAD_COMPARE_MODAL_OPENED: "Download Compare Modal Opened",
  EMBEDDABLE_MAP_DOWNLOADED: "Embeddable Map Downloaded",
  LOCATION_SEARCHED: "Location Searched",
  MAP_CHANGED: "Map Changed",
  MAP_DESCRIPTION_VIEWED: "Map Description Viewed",
  MAP_PROJECTION_CHANGED: "Map Projection Changed",
  MAP_SCREENSHOT_TAKEN: "Map Screenshot Taken",
  MAP_TILESET_CLICKED: "Map Tileset Clicked",
  MAP_TOUR_STARTED: "Map Tour Started",
  MAP_ZOOMED: "Map Zoomed",
  MOBILE_ACTIONS_MENU_OPENED: "Mobile Actions Menu Opened",
  QR_CODE_DOWNLOADED: "QR Code Downloaded",
  SEARCH_RESULT_SELECTED: "Search Result Selected",
  WARMING_SCENARIO_CHANGED: "Warming Scenario Changed",
  WARMING_SCENARIOS_SECTION_TOGGLED: "Warming Scenarios Section Toggled",
} as const;

/**
 * Track a Mixpanel event via the WP-side AppAnalytics API.
 *
 * When the maps app is embedded in WordPress, window.AppAnalytics
 * is provided by the WP theme's mixpanel-events.js (gated by
 * Complianz cookie consent). Safe to call anytime — silently
 * no-ops if Mixpanel consent hasn't been granted or when running
 * in standalone dev mode.
 */
export function trackMixpanelEvent(eventName: string, props?: Record<string, any>): void {
  if (window.AppAnalytics?.track) {
    window.AppAnalytics.track(eventName, {
      ...props,
      page_url: window.location.href,
    });
  }
}

/**
 * Reverse geocodes the clicked coordinates to enrich the event with
 * country and city names. Falls back to tracking without location
 * names if geocoding is unavailable or fails.
 *
 * @param geocodingService - Mapbox geocoding client, or null if unavailable.
 * @param props - Base event properties (map name and warming scenario).
 * @param lngLat - The [longitude, latitude] of the click, used for both
 *   reverse geocoding and as tracked event properties.
 */
export function trackMapTilesetClicked(
  geocodingService: { reverseGeocode: Function } | null,
  props: { map_name?: string; warming_scenario: number },
  lngLat: [number, number],
): void {
  const baseProps = {
    ...props,
    longitude: lngLat[0].toFixed(4),
    latitude: lngLat[1].toFixed(4),
  };

  if (geocodingService) {
    geocodingService
      .reverseGeocode({
        query: lngLat,
        types: ["country", "place"],
        language: ["en"],
      })
      .send()
      .then((response: any) => {
        const features = response.body?.features || [];
        const country = features.find((f: any) => f.place_type?.includes("country"));
        const city = features.find((f: any) => f.place_type?.includes("place"));
        trackMixpanelEvent(AnalyticsEvent.MAP_TILESET_CLICKED, {
          ...baseProps,
          country_name: country?.text || undefined,
          city_name: city?.text || undefined,
        });
      })
      .catch(() => {
        trackMixpanelEvent(AnalyticsEvent.MAP_TILESET_CLICKED, baseProps);
      });
  } else {
    trackMixpanelEvent(AnalyticsEvent.MAP_TILESET_CLICKED, baseProps);
  }
}
