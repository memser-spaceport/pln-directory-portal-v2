import type { IJobRole } from '@/types/jobs.types';

import type { BoardViewer } from './viewerState';
import { VIEWER_NAME } from './profile/viewerIdentity';

/**
 * A listing's life on the board, as the team that owns it sees it.
 *
 * **Production has none of this.** Every role on `/jobs` is scraped from a
 * team's careers page by the ingest, and a role leaves the board when the
 * scraper stops finding it. There is no way for a team to put a job on the board
 * itself, and no way to take one off. This file is the shape both of those
 * would need — and it is deliberately the smallest shape that answers the two
 * questions a lead actually has: *is it up yet?* and *can I take it down?*
 *
 * Three states, no more:
 *
 *  - `in-review`   submitted through the board, not yet approved by the PL
 *                  team. Visible only to the people who can manage the listing.
 *  - `live`        on the board for everyone.
 *  - `inactive`    taken down by the team. Off the board, kept on the team's
 *                  own list so it can be brought back.
 *
 * No `filled`, no `closed`, no reason picker. Production's team Asks close with
 * one of seven reasons and a comment, and that is a status *report* about a
 * request other people made progress on. A job listing is a switch: it is
 * either accepting applicants or it is not, and the only fact worth recording
 * about the off state is that it can be undone. A reason can be added the day
 * someone asks what it would be for.
 *
 * `declined` is not here either. The PL team refusing a submission is a real
 * outcome, but it is a message to the submitter — email, or a note on the row —
 * not a state the board keeps a listing in. Left as an open question rather
 * than drawn.
 */
export type ListingStatus = 'live' | 'in-review' | 'inactive';

/**
 * Where a listing came from, because it decides what the team can do with it.
 *
 * **This is the TBD, kept visible.** The brief left open *which* listings the
 * inactive control applies to. There are two kinds on any team's list:
 *
 *  - `submitted`  a lead typed it into the board. The board is the source of
 *                 truth, so taking it down is simply taking it down.
 *  - `ingested`   the scraper found it on the team's careers page. The careers
 *                 page is the source of truth, so "inactive" here can only mean
 *                 *suppress it on the board* — and the next scrape has to
 *                 remember that, or the role reappears a day later.
 *
 * The prototype offers the control on both, because narrowing is a deletion
 * and widening is a design — and it says on every row which kind it is, so a
 * reviewer can see the question rather than have it explained. If the answer
 * is "submitted only", `JobReferRoleRow` gates the control on `origin.kind` and
 * nothing else changes.
 */
export type ListingOrigin =
  | { kind: 'submitted'; /** Member name. `VIEWER_NAME` renders as "you". */ by: string }
  | { kind: 'ingested'; /** The careers page host, as the row shows it. */ source: string };

export interface ListingMeta {
  status: ListingStatus;
  origin: ListingOrigin;
}

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  live: 'Live',
  'in-review': 'In review',
  inactive: 'Inactive',
};

/** "Submitted by you" / "Submitted by Hunter Delacroix" / "From filecoin.io/careers". */
export function describeOrigin(origin: ListingOrigin): string {
  if (origin.kind === 'ingested') return `From ${origin.source}`;
  return `Submitted by ${origin.by === VIEWER_NAME ? 'you' : origin.by}`;
}

/**
 * Which team the `team-lead` viewer leads.
 *
 * Filecoin Foundation, because it is already the board's sample team: every
 * pinned overlay names its first role, the `applied` viewer's two applications
 * went to it, and the review-state frames below reuse the same card. One team
 * carrying every scenario is what lets the frames read as one story.
 */
export const LEAD_TEAM_UID = 'filecoin-foundation';

/**
 * The teams whose listings this viewer manages — the prototype's stand-in for
 * production's `isTeamLeaderOrAdmin(userInfo, teamId)`, which is
 * `isAdminUser(userInfo) || userInfo.leadingTeams.includes(teamId)`.
 *
 * `'all'` for an admin, a uid list for a lead, empty for everyone else. A
 * function of the viewer alone, so the board, the card, the row and the drawer
 * all ask one question and cannot disagree about who is allowed to press what.
 */
export function managedTeamUids(viewer: BoardViewer): 'all' | string[] {
  if (viewer === 'directory-admin') return 'all';
  if (viewer === 'team-lead') return [LEAD_TEAM_UID];
  return [];
}

export function canManageTeam(viewer: BoardViewer, teamUid: string): boolean {
  const managed = managedTeamUids(viewer);
  return managed === 'all' || managed.includes(teamUid);
}

/** Whether the toolbar offers **Submit a job** at all — the same people who manage listings. */
export function canSubmitJobs(viewer: BoardViewer): boolean {
  const managed = managedTeamUids(viewer);
  return managed === 'all' || managed.length > 0;
}

/* Dates relative to now, like `mocks.ts` — safe because the board renders only
   after mount, so the server never paints a value the client would disagree with. */
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const stamped = (role: Omit<IJobRole, 'lastUpdated' | 'postedDate' | 'detectionDate'>, ageDays: number): IJobRole => {
  const iso = daysAgo(ageDays);
  return { ...role, postedDate: iso, detectionDate: iso, lastUpdated: iso };
};

/**
 * Listings that are NOT on the public board — the review queue and the taken-down.
 *
 * Grouped by team uid. The board merges these into each team's roles only for
 * the viewers who manage that team, so a member or a visitor never sees them.
 *
 * Filecoin Foundation gets one of each, so the lead's list shows every state
 * without the reviewer having to produce them by hand. libp2p gets one in
 * review so the admin's list shows that the queue spans teams.
 */
export const MOCK_UNLISTED_ROLES: Record<string, IJobRole[]> = {
  'filecoin-foundation': [
    stamped(
      {
        uid: 'ff-3',
        roleTitle: 'Community Manager, Filecoin Ecosystem',
        roleCategory: 'Marketing',
        seniority: 'Mid (L3)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: null,
        descriptionHtml:
          '<p>Filecoin Foundation is looking for a Community Manager to run the programs that keep builders in the ecosystem connected — office hours, the ambassador program, and the monthly ecosystem call.</p><p>You will own the calendar, the comms and the follow-through, and you will be the first person most new builders talk to.</p><ul><li>Run recurring community programs end to end.</li><li>Write the ecosystem newsletter and the call notes.</li><li>Surface what builders are asking for to the grants and engineering teams.</li></ul>',
      },
      1,
    ),
    stamped(
      {
        uid: 'ff-4',
        roleTitle: 'Senior Smart Contract Engineer (FVM)',
        roleCategory: 'Engineering',
        seniority: 'Senior (L4)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: 'https://example.com/apply/ff-4',
      },
      41,
    ),
  ],
  libp2p: [
    stamped(
      {
        uid: 'lp-3',
        roleTitle: 'Technical Writer, Specifications',
        roleCategory: 'Marketing',
        seniority: 'Mid (L3)',
        location: ['Remote'],
        workMode: 'remote',
        applyUrl: null,
        descriptionHtml:
          '<p>libp2p is hiring a Technical Writer to own the specifications repository — turning the maintainers’ design notes into documents an implementer in another language can build from.</p>',
      },
      2,
    ),
  ],
};

/**
 * Every listing's status and origin, public roles included.
 *
 * Public roles default to `live` + `ingested` (the scraper is where they all
 * come from today), keyed by team so the source host reads right. Two Filecoin
 * roles are seeded as *submitted* so the lead's list shows both origins side by
 * side — see `ListingOrigin` for why that matters.
 */
const CAREERS_HOST: Record<string, string> = {
  'protocol-labs': 'protocol.ai/jobs',
  'filecoin-foundation': 'fil.org/careers',
  libp2p: 'libp2p.io/jobs',
  'ipfs-collective': 'ipfs.tech/jobs',
  drand: 'drand.love/careers',
  bacalhau: 'bacalhau.org/careers',
};

export function seedListingMeta(publicRolesByTeam: Array<{ teamUid: string; roles: IJobRole[] }>): Map<string, ListingMeta> {
  const map = new Map<string, ListingMeta>();
  for (const { teamUid, roles } of publicRolesByTeam) {
    for (const role of roles) {
      map.set(role.uid, {
        status: 'live',
        origin: { kind: 'ingested', source: CAREERS_HOST[teamUid] ?? 'the team’s careers page' },
      });
    }
  }
  /* The lead's team: one live listing that came through the board, so the
     list shows a submitted job in its finished state as well as in review. */
  map.set('ff-2', { status: 'live', origin: { kind: 'submitted', by: 'Marta Bellini' } });
  map.set('ff-3', { status: 'in-review', origin: { kind: 'submitted', by: 'Hunter Delacroix' } });
  map.set('ff-4', { status: 'inactive', origin: { kind: 'submitted', by: 'Clara Nystrom' } });
  map.set('lp-3', { status: 'in-review', origin: { kind: 'submitted', by: 'Jonas Wexler' } });
  return map;
}
