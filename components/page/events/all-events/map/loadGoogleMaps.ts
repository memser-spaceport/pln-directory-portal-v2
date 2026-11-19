import type { GoogleMapsLibs } from './google-maps.types';

/*
 * Loads the Google Maps JavaScript API once per page (LAB-3321, design D7) with Google's documented "dynamic library
 * import" bootstrap, written out instead of minified: it installs `google.maps.importLibrary`, which adds the script
 * on the first call. A failed load is forgotten, so "Try again" retries.
 */

type ImportLibrary = typeof google.maps.importLibrary;
/** The namespace before Google's script has filled it: the bootstrap's own `importLibrary` and its callback. */
interface MapsNamespace {
  importLibrary?: ImportLibrary;
  __ib__?: () => void;
}
type GoogleWindow = { google?: { maps?: MapsNamespace } };

function mapsNamespace(): MapsNamespace {
  const w = window as unknown as GoogleWindow;
  w.google ??= {};
  w.google.maps ??= {};
  return w.google.maps;
}

function installBootstrap(key: string) {
  const maps = mapsNamespace();
  if (maps.importLibrary) return;

  const libraries = new Set<string>();
  let loading: Promise<void> | null = null;
  const load = () =>
    (loading ??= new Promise<void>((resolve, reject) => {
      const params = new URLSearchParams({
        key,
        v: 'weekly',
        libraries: [...libraries].join(','),
        callback: 'google.maps.__ib__',
      });
      maps.__ib__ = resolve;
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.nonce = document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce || '';
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error('The Google Maps JavaScript API could not load.'));
      };
      document.head.append(script);
    }));

  // Until the script has loaded; then Google's own importLibrary replaces this one on the same namespace.
  maps.importLibrary = ((name: string) => {
    libraries.add(name);
    return load().then(() => (mapsNamespace().importLibrary as ImportLibrary)(name));
  }) as ImportLibrary;
}

export async function loadGoogleMaps(key: string): Promise<GoogleMapsLibs> {
  installBootstrap(key);
  const importLibrary = mapsNamespace().importLibrary as ImportLibrary;
  const [maps, marker, core] = await Promise.all([
    importLibrary('maps') as Promise<google.maps.MapsLibrary>,
    importLibrary('marker') as Promise<google.maps.MarkerLibrary>,
    importLibrary('core') as Promise<google.maps.CoreLibrary>,
  ]);
  return { Map: maps.Map, AdvancedMarkerElement: marker.AdvancedMarkerElement, LatLngBounds: core.LatLngBounds };
}
