/**
 * The event drawer (LAB-3211): "I'm going", show on my profile and the attendee list for one IRL event, opened from
 * the member and team profiles and the Home v2 rail. Build-time (Turbopack inlines it), so tests mock this module,
 * not process.env.
 */
export const SHOW_EVENT_DRAWER: boolean = process.env.NEXT_PUBLIC_SHOW_EVENT_DRAWER === 'true';
