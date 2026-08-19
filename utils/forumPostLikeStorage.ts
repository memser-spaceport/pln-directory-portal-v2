// Best-effort, cross-session memory of the viewer's own forum post likes,
// keyed by forum post uid (`fp_<tid>`). Exists because NodeBB's /api/recent —
// which builds the Team News forum card list — carries no per-viewer vote
// state at all (see resolveForumPostLike.ts), so without this a post liked in
// an earlier session, or liked on /forum, renders as un-liked on the card
// until its thread happens to be opened. Local-only: a like made on another
// device/browser still won't show here until learned some other way.

const STORAGE_KEY = 'directory:forumPostLikes';

function readStore(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getStoredForumPostLike(uid: string): boolean | undefined {
  return readStore()[uid];
}

export function setStoredForumPostLike(uid: string, liked: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    const store = readStore();
    store[uid] = liked;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Unavailable (private browsing, quota) — best-effort cache, skip silently.
  }
}
