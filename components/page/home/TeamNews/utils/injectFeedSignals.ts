import type { IDeal } from '@/types/deals.types';
import type { IJobTeamGroup } from '@/types/jobs.types';

import type { FeedEntry, RankedFeedEntry } from './mergeFeedEntries';

/** Hiring roll-ups per render. Uncapped, a busy window puts more job cards on
 *  the first page than news. */
export const MAX_HIRING_ENTRIES = 2;
export const MAX_DEAL_ENTRIES = 2;

/** Ranked entries between one supporting card and the next. With the default
 *  pageSize of 6 the first page reads: three stories, a signal, two stories. */
export const SUPPORTING_CADENCE = 3;

/** Most recent activity on a team's roles — `postedDate` when the board has it,
 *  `lastUpdated` (always present) otherwise. */
export function hiringGroupDate(group: IJobTeamGroup): string {
  return group.roles.reduce((max, role) => {
    const d = role.postedDate ?? role.lastUpdated;
    return d > max ? d : max;
  }, '');
}

/**
 * Slots hiring roll-ups and deals into an already-merged feed.
 *
 * ## Why this is a separate pass, not part of mergeFeedEntries
 *
 * That function's contract is "news-vs-news order is byte-identical to the
 * pre-feature feed under every sort mode", and it earns that by delegating to
 * sortTeamNewsClusters rather than re-sorting. Folding a second concern into it
 * would put that guarantee at risk on every future edit. Kept separate, this
 * pass is independently testable, independently revertable, and structurally
 * incapable of reordering news.
 *
 * ## Why slotted, not ranked
 *
 * Forum posts are ranked into the feed because they carry the currency of the
 * mode they join — a likeCount under 'popular', a createdAt under 'latest'.
 * Hiring roll-ups and deals carry neither. Ranking them would mean inventing a
 * popularity signal they don't have, and 'popular' is the DEFAULT sort — under
 * an honest zero they would sink past `pageSize` and never be seen at all.
 *
 * So they are placed at a fixed cadence instead: one supporting card after
 * every `SUPPORTING_CADENCE` ranked entries, alternating hiring → deal so
 * neither kind clusters at the top. The placement is identical under all three
 * sorts, which also means changing the sort never shuffles them around.
 *
 * ## A story always leads
 *
 * Hiring and deals are the freshest things most weeks. The cadence starts
 * counting from the top of the feed, so the first supporting card can never
 * appear before `SUPPORTING_CADENCE` stories — an investor opening the page to
 * a wall of job roll-ups and vendor perks reads it as a job board with ads.
 * With no ranked entries at all this returns them unchanged: the feed's own
 * empty state is the honest answer, not a page of nothing but jobs.
 *
 * `hiring`/`deals` undefined ⇒ the entries unchanged. That is the typed shape
 * of "not loaded / no access / request failed", the same accepted pop-in
 * `forumPosts` already has in mergeFeedEntries.
 */
export function injectFeedSignals({
  entries,
  hiring,
  deals,
}: {
  entries: RankedFeedEntry[];
  hiring: IJobTeamGroup[] | undefined;
  deals: IDeal[] | undefined;
}): FeedEntry[] {
  // Nothing to lead with — see "A story always leads" above.
  if (entries.length === 0) return entries;

  const hiringEntries: FeedEntry[] = [...(hiring ?? [])]
    .sort((a, b) => hiringGroupDate(b).localeCompare(hiringGroupDate(a)))
    .slice(0, MAX_HIRING_ENTRIES)
    .map((group) => ({ kind: 'hiring', group }));

  const dealEntries: FeedEntry[] = [...(deals ?? [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_DEAL_ENTRIES)
    .map((deal) => ({ kind: 'deal', deal }));

  // Alternate rather than concatenate: two hiring cards back to back at the
  // first two slots would read as a hiring section that news happens to follow.
  const supporting: FeedEntry[] = [];
  for (let i = 0; i < Math.max(hiringEntries.length, dealEntries.length); i++) {
    if (hiringEntries[i]) supporting.push(hiringEntries[i]);
    if (dealEntries[i]) supporting.push(dealEntries[i]);
  }
  if (supporting.length === 0) return entries;

  const out: FeedEntry[] = [];
  let next = 0;
  let sinceLastSignal = 0;

  for (const entry of entries) {
    out.push(entry);
    sinceLastSignal++;
    if (sinceLastSignal >= SUPPORTING_CADENCE && next < supporting.length) {
      out.push(supporting[next++]);
      sinceLastSignal = 0;
    }
  }

  // A feed shorter than the cadence still gets its signals, just at the end
  // rather than dropped — they were fetched, and the reader can act on them.
  out.push(...supporting.slice(next));
  return out;
}
