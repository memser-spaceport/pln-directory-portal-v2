import { getCurrentRoundNumber } from '@/utils/plaa-round.utils';
import type { CommunityKudosLimits } from '@/schema/kudos-forms';
import type { ICommunityKudos, IUserSummary } from '@/components/page/aligement-assets/kudos-board/data/kudos-board.types';

/**
 * The signed-in giver this prototype simulates — matches PLAA-50's mockup
 * persona. Carries both `uid` (what `currentUserForPreview` compares against)
 * and `memberId` (what `IUserSummary`/`kudos.giver` uses for the same person)
 * since this object doubles as both below — they must be the same value.
 */
export const mockCurrentUser = { uid: 'uid-ada-chen', memberId: 'uid-ada-chen', name: 'Ada Chen' };

export const mockRecipients: IUserSummary[] = [
  { memberId: 'uid-lena-okafor', name: 'Lena Okafor' },
  { memberId: 'uid-jonas-hale', name: 'Jonas Hale' },
  { memberId: 'uid-sam-rivera', name: 'Sam Rivera' },
];

/** Mirrors real community-pool values; production gets these live from ICommunityPool. */
export const mockLimits: CommunityKudosLimits = {
  pointsMin: 10,
  pointsMax: 100,
  pointsStep: 10,
  messageMin: 25,
  messageMax: 500,
};

const currentRoundId = String(getCurrentRoundNumber());
const pastRoundId = String(getCurrentRoundNumber() - 1);

// Fixed, literal timestamps — NOT `Date.now() - N`. This module runs once
// during server render and again during client hydration; a `Date.now()`
// computed at module scope produces a different value each time (seconds or
// more apart), so `formatRelativeTime()` renders different text server- vs
// client-side, React flags a hydration mismatch, and force-rerenders right
// after load. That reads as "the page isn't stable" even though nothing is
// actually broken — literal strings sidestep it entirely.
export const mockKudos: ICommunityKudos[] = [
  {
    id: 'kudos-editable',
    giver: mockCurrentUser,
    recipient: mockRecipients[0],
    roundId: currentRoundId,
    points: 60,
    message: 'Ran the retro that finally got the two teams talking about the shared schema.',
    createdAt: '2026-08-15T09:00:00.000Z', // renders as "Yesterday" as of this prototype's mock "today"
  },
  {
    id: 'kudos-finalized',
    giver: mockCurrentUser,
    recipient: mockRecipients[1],
    roundId: pastRoundId,
    points: 30,
    message: 'Wrote the incident postmortem that everyone now points new hires at.',
    createdAt: '2026-07-02T09:00:00.000Z',
  },
  {
    id: 'kudos-not-mine',
    giver: { memberId: 'uid-someone-else', name: 'Priya Shah' },
    recipient: mockRecipients[2],
    roundId: currentRoundId,
    points: 20,
    message: 'Paired with me for two hours to untangle the flaky CI job — much appreciated.',
    createdAt: '2026-08-16T05:00:00.000Z',
  },
];

/** Pool remaining before any of the above kudos' own points are added back for editing. */
export const mockPoolRemaining = 40;
