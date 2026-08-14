import { isForumPostUid } from '@/types/feed.types';

/**
 * The highest comment count we have reason to believe for a forum post, kept
 * per tab so it survives a reload.
 *
 * It exists because NodeBB's `/api/recent` — the only source a feed card has
 * before anyone opens a thread — can serve a `postcount` that predates a reply
 * that already exists. Left alone, that reads as "0 Comments" on a topic that
 * has comments, and a member's own just-posted comment appears to vanish on
 * refresh.
 *
 * A floor WITH RESPECT TO THE LISTING, not a maximum of everything ever seen:
 * `useFeedSocial` seeds `max(listing, floor)`, so a stale listing can never
 * drag the number down. First-hand knowledge — our own write, or an
 * authoritative `/api/topic/{tid}` read — calls `writeCountFloor` and REPLACES
 * it, which is what lets a deletion bring the number back down instead of
 * pinning it high for the life of the tab.
 *
 * Never read during render: `useFeedSocial` reads it inside its seeding effect
 * and the mutations write from their options callbacks, so there is no
 * server/client divergence to hydrate around and CommentButton stays untouched.
 *
 * Forum posts only. News counts come from the directory backend, which is
 * authoritative and immediate — a floor there would hide another member's
 * deletion rather than compensate for staleness.
 */

const STORAGE_KEY = 'feed.commentCountFloor.v1';

// /api/recent returns a few dozen topics, so this is headroom rather than a
// limit anyone reaches — it just keeps a long session from growing the entry
// without bound.
const MAX_ENTRIES = 200;

/** Blocked-storage browsers throw on ACCESS, not just on read, so even naming
 *  `sessionStorage` has to be guarded. `null` means "no storage" — every caller
 *  degrades to the listing value, which is the behaviour before this existed. */
function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Every remembered count, or `{}` — a missing, unreadable, or malformed entry
 *  is not an error worth surfacing, it just means there is nothing to add to
 *  what the listing already said. */
export function readCountFloors(): Record<string, number> {
  const store = storage();
  if (!store) return {};

  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    // Validated key by key rather than cast: this is storage another tab, an
    // older build, or a curious member could have written, and one bad value
    // must not take out every other count on the page.
    const floors: Record<string, number> = {};
    for (const [uid, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (isForumPostUid(uid) && typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        floors[uid] = value;
      }
    }
    return floors;
  } catch {
    return {};
  }
}

/** Replace what we remember for `uid`. Replace, not raise: callers only reach
 *  here with first-hand knowledge (their own write, or the topic's own count),
 *  which outranks anything the listing said — in both directions. */
export function writeCountFloor(uid: string, count: number): void {
  if (!isForumPostUid(uid) || !Number.isFinite(count) || count < 0) return;

  const store = storage();
  if (!store) return;

  const floors = readCountFloors();
  // Deleting first re-inserts at the END of the key order, so the trim below
  // drops the least recently written rather than whichever happened to be
  // serialised first.
  delete floors[uid];
  floors[uid] = count;

  const uids = Object.keys(floors);
  const kept = uids.slice(Math.max(0, uids.length - MAX_ENTRIES));

  try {
    store.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(kept.map((key) => [key, floors[key]]))));
  } catch {
    // Quota, or storage blocked mid-session. The count falls back to the
    // listing value — stale, but no worse than before this module existed.
  }
}
