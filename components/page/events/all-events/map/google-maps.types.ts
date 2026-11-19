/*
 * The few Google Maps JavaScript API shapes the All Events Map uses (LAB-3321). The repo has no `@types/google.maps`
 * and the design adds no dependency, so these are written out by hand from Google's reference.
 */

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface MapsEventListener {
  remove(): void;
}

export interface GoogleMap {
  setZoom(zoom: number): void;
  getZoom(): number | undefined;
  setCenter(center: LatLngLiteral): void;
  fitBounds(bounds: LatLngBounds, padding?: number): void;
  addListener(event: 'zoom_changed' | 'click', handler: () => void): MapsEventListener;
}

export interface GoogleMapOptions {
  mapId: string;
  center: LatLngLiteral;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  disableDefaultUI?: boolean;
  gestureHandling?: 'greedy' | 'cooperative' | 'none' | 'auto';
  clickableIcons?: boolean;
}

export interface LatLngBounds {
  extend(point: LatLngLiteral): LatLngBounds;
}

export interface AdvancedMarker {
  map: GoogleMap | null;
  position: LatLngLiteral | null;
  content: HTMLElement | null;
  title: string;
  zIndex: number | null;
  addEventListener(event: 'gmp-click', handler: () => void): void;
}

export interface AdvancedMarkerOptions {
  map: GoogleMap;
  position: LatLngLiteral;
  content: HTMLElement;
  title: string;
  gmpClickable: boolean;
}

export interface GoogleMapsLibs {
  Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMap;
  AdvancedMarkerElement: new (options: AdvancedMarkerOptions) => AdvancedMarker;
  LatLngBounds: new () => LatLngBounds;
}
