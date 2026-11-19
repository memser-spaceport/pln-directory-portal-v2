/**
 * The native All Events page (LAB-3247): `/events/all` renders it instead of the events app iframe. Build-time
 * (Turbopack inlines it), so tests mock this module, not process.env. Turning it off is the rollback.
 */
export const SHOW_EVENTS_PAGE_V2: boolean = process.env.NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2 === 'true';

/** The browser key for Google Maps (LAB-3321). Public by design: Google restricts it by referrer, not by secrecy. */
export const GOOGLE_MAPS_API_KEY: string = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

/**
 * The Map ID that advanced markers need. Unset, the map uses Google's `DEMO_MAP_ID`, which Google offers for testing:
 * set a real one for production.
 */
export const GOOGLE_MAPS_MAP_ID: string = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

/** The Map view exists only with a key; without one the view switch has no Map and `?view=map` opens the List. */
export const HAS_EVENTS_MAP: boolean = GOOGLE_MAPS_API_KEY.length > 0;
