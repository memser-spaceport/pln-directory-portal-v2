/**
 * Submitting and managing events in LabOS: the submit form (`/events/submit`), the edit page (`/events/edit/<uid>`),
 * My Submissions (`/events/mine`), the drawer's "Edit" and the header's "My Submissions". Off, "Submit an event"
 * opens the old submission portal and the three routes answer not found. Build-time (Turbopack inlines it), so tests
 * mock this module, not process.env. It is turned on where the backend's `EVENTS_LOCAL_SUBMIT_ENABLED` is on.
 */
export const EVENTS_LOCAL_SUBMIT: boolean = process.env.NEXT_PUBLIC_EVENTS_LOCAL_SUBMIT === 'true';

export const EVENTS_SUBMIT_PATH = '/events/submit';
export const EVENTS_MINE_PATH = '/events/mine';
export const eventEditPath = (uid: string) => `/events/edit/${encodeURIComponent(uid)}`;
