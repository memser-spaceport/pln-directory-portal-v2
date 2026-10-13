import type { ITeamNewsItem } from '@/types/team-news.types';

import { MOCK_VIEWER } from '../help-feedback-menu/mocks';
import { htmlToPlainText } from '../team-profile/newsUrl';

/**
 * Team-posted news: who wrote it, whether it has been changed since — and the
 * one mocked "backend" the team profile and the network feed both read, so an
 * edit or a removal made on the profile is what the feed shows next.
 *
 * WHO IS AUTHORIZED. The same people who can post: production's rule for the
 * team's own surfaces is `isCurrentUserTeamMember || isAdmin`, and editing or
 * removing a published post draws no narrower line — a directory admin, a lead
 * of the team, or any member of the team. The post is the team's, not the
 * poster's: the card is attributed to the team, the feed shows it under the
 * team's name, and a teammate fixing a typo or pulling a stale announcement
 * should not have to find whoever pressed Post. (An earlier version limited a
 * plain member to their own posts; that was corrected — post rights and edit
 * rights are one right.) A visitor gets no control at all — not a disabled
 * one. `canManageTeamPost` is that rule in one place, so the rail, the archive
 * and the story modal cannot disagree.
 *
 * WHAT IS EDITABLE. Only what the compose form collected: headline, body,
 * link. Enriched coverage (the pipeline's summaries of outlet articles) has no
 * author here to edit it, so it never carries `post` and never gets the menu.
 *
 * "EDITED" IS A FACT, NOT A NEW EVENT. An edit sets `post.editedAt` and leaves
 * `eventDate` alone: the post keeps its place in every list, and the card says
 * "Edited" beside the time (X and LinkedIn both mark an edited post this way).
 * Followers may have read the first version, and the thread under it may quote
 * it; a post that changes silently makes those comments read as wrong.
 *
 * REMOVE IS FINAL FROM THE READER'S SIDE. There is no "Removed" list and no
 * restore control: the press confirms first (the product's own ConfirmDialog,
 * the way the team's Delete and a listing's Delete do), and after that the
 * post is gone from the rail, the archive, the story modal and the feed. In
 * production this should be a soft delete (`deletedAt`) so a back-office admin
 * can restore on request — a directory surface for un-removing news is a list
 * nobody asked for.
 */

export type TeamPostRole = 'admin' | 'lead' | 'member' | 'public';

export interface TeamPostMeta {
  posterUid: string;
  posterName: string;
  /** Set on the first save after publishing; the card shows "Edited". */
  editedAt?: string;
}

/** A news item plus, for team-posted ones, its authorship. */
export type NewsItemWithPost = ITeamNewsItem & { post?: TeamPostMeta };

/** The signed-in reviewer — the same person every prototype signs its forms as. */
export const TEAM_POST_VIEWER = { uid: 'viewer', name: MOCK_VIEWER.name };

export function canManageTeamPost(item: NewsItemWithPost, role: TeamPostRole, _viewerUid: string): boolean {
  if (!item.post) return false;
  return role === 'admin' || role === 'lead' || role === 'member';
}

// ---------- Seeds ----------

const RESIDENCY_BODY =
  '<p>Applications are open for the 2026 network residency: twelve weeks in Lisbon working alongside PL research teams, with a stipend and travel covered. We’re looking for engineers and researchers working on content addressing, verifiable compute and decentralized identity.</p><p>Applications close 31 July. Selected residents hear back by mid-August.</p>';

const CAMP_BODY =
  '<p>IPFS Camp returns 14–16 October in Lisbon. Talks, workshops and the hack day run across three days, and the call for sessions is open now — propose a talk or a workshop by 15 August.</p>';

/**
 * Two posts already on the team's page when the demo opens: one by the
 * reviewer, one by a teammate. Every team seat (admin, lead, member) gets the
 * menu on both; a visitor sees neither. The pair still earns its place: the
 * menu's heading reads "Posted by you" on the first and "Posted by Molly
 * Mackinlay" on the second, which is the one fact a teammate needs before
 * removing something they didn't write.
 *
 * The same two items are in the network feed's fixture, so what happens to
 * them on the profile can be checked on the feed.
 */
export const TEAM_POSTED_SEED: NewsItemWithPost[] = [
  {
    uid: 'news-posted-1',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-28T18:00:00.000Z',
    title: 'Protocol Labs opens applications for the 2026 network residency',
    summary: htmlToPlainText(RESIDENCY_BODY),
    contentHtml: RESIDENCY_BODY,
    sourceUrl: 'https://protocol.ai/blog/residency-2026',
    sourceDomain: 'protocol.ai',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: '2026-06-28T18:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
    isTeamPosted: true,
    post: { posterUid: TEAM_POST_VIEWER.uid, posterName: TEAM_POST_VIEWER.name },
  },
  {
    uid: 'news-posted-2',
    teamUid: 'protocol-labs',
    teamName: 'Protocol Labs',
    teamLogoUrl: null,
    eventType: 'ANNOUNCEMENT',
    eventDate: '2026-06-26T10:00:00.000Z',
    title: 'IPFS Camp 2026 dates and venue announced',
    summary: htmlToPlainText(CAMP_BODY),
    contentHtml: CAMP_BODY,
    sourceUrl: 'https://camp.ipfs.tech',
    sourceDomain: 'camp.ipfs.tech',
    tags: [],
    focusAreas: [],
    subFocusAreas: [],
    createdAt: '2026-06-26T10:00:00.000Z',
    discussion: { count: 0, latestTopicUrl: null },
    isTeamPosted: true,
    // mem-2 on the team's member list — a member, not a lead.
    post: { posterUid: 'mem-2', posterName: 'Molly Mackinlay' },
  },
];

// ---------- The mocked backend ----------

/** What an edit or a removal changes on a post; keyed by the post's uid. */
export interface TeamPostOverride {
  removed?: true;
  title?: string;
  summary?: string | null;
  contentHtml?: string;
  sourceUrl?: string;
  sourceDomain?: string | null;
  editedAt?: string;
}

export type TeamPostOverrides = Record<string, TeamPostOverride>;

/**
 * Session storage, deliberately: the profile and the feed are two routes, so
 * the change has to survive a navigation — but a fresh tab should open on the
 * fixture as shipped, and a reviewer should not need to know how to clear
 * storage to get it back (the profile's demo bar also has a Reset).
 */
const STORAGE_KEY = 'pln-prototypes:team-post-overrides';

export function readTeamPostOverrides(): TeamPostOverrides {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TeamPostOverrides) : {};
  } catch {
    return {};
  }
}

export function writeTeamPostOverride(uid: string, patch: TeamPostOverride): TeamPostOverrides {
  const all = readTeamPostOverrides();
  const next = { ...all, [uid]: { ...all[uid], ...patch } };
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — the in-memory state still updates */
  }
  return next;
}

export function clearTeamPostOverrides() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}

/** The fixture as the backend would now return it: removed posts gone, edits merged. */
export function applyTeamPostOverrides<T extends NewsItemWithPost>(items: T[], overrides: TeamPostOverrides): T[] {
  return items.flatMap((item) => {
    const o = overrides[item.uid];
    if (!o) return [item];
    if (o.removed) return [];
    const { removed: _removed, editedAt, ...fields } = o;
    return [
      {
        ...item,
        ...fields,
        post: item.post ? { ...item.post, editedAt: editedAt ?? item.post.editedAt } : item.post,
      },
    ];
  });
}
