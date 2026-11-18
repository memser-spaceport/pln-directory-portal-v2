/**
 * The native All Events page (LAB-3247): `/events/all` renders it instead of the events app iframe. Build-time
 * (Turbopack inlines it), so tests mock this module, not process.env. Turning it off is the rollback.
 */
export const SHOW_EVENTS_PAGE_V2: boolean = process.env.NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2 === 'true';
