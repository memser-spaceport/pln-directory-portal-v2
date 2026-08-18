import { getCurrentRoundNumber } from '@/utils/plaa-round.utils';
import type { CommunityKudosLimits } from '@/schema/kudos-forms';
import type { ICommunityKudos, IUserSummary } from '@/components/page/aligement-assets/kudos-board/data/kudos-board.types';

// Doubles as both `currentUserForPreview` and `kudos.giver` below — uid and memberId must match.
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

// Literal timestamps, not `Date.now() - N`: this module runs once at server
// render and again at hydration, and a module-scope `Date.now()` would
// differ between the two and trip a hydration mismatch.
export const mockKudos: ICommunityKudos[] = [
  {
    id: 'kudos-editable',
    giver: mockCurrentUser,
    recipient: mockRecipients[0],
    roundId: currentRoundId,
    points: 60,
    message: 'Ran the retro that finally got the two teams talking about the shared schema.',
    createdAt: '2026-08-15T09:00:00.000Z',
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
