/// <reference types="google.maps" />

/*
 * The Google Maps classes the All Events Map (LAB-3321) gets from `importLibrary`, typed by the repo's
 * `@types/google.maps`. Passed around as values, so tests can hand the map fakes.
 */
export interface GoogleMapsLibs {
  Map: typeof google.maps.Map;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
  LatLngBounds: typeof google.maps.LatLngBounds;
}

export type LatLngLiteral = google.maps.LatLngLiteral;
