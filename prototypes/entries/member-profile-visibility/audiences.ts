// Who can see each part of a member profile, read off production's own gates
// (components/page/member-details/*, 2026-11-16) — not off the badges in the
// design being reviewed, two of which disagree with the code. See the notes on
// `cv` and `investor`.

export type AudienceKey = 'public' | 'members' | 'cv' | 'investor';

export interface Audience {
  /** The word on the badge. */
  label: string;
  /** The popover's answer to "who can see this?" — one sentence, readers named. */
  who: string;
  icon: 'globe' | 'people' | 'lock';
}

export const AUDIENCES: Record<AudienceKey, Audience> = {
  /** `ProfileDetails` renders for signed-out visitors too. */
  public: {
    label: 'Public',
    who: "Anyone can see this, including people who aren't signed in.",
    icon: 'globe',
  },
  /** Teams, Experience, Contributions, Repositories, Office Hours and Contact
   *  Details all return null without `isLoggedIn` (several also need an
   *  approved account). */
  members: {
    label: 'Members only',
    who: 'Signed-in PL network members can see this.',
    icon: 'people',
  },
  /** `assertCanView` on `GET /cv-imports/latest`: the member, a directory admin,
   *  and a lead of a team this member applied to. So "Private" is not the
   *  whole truth, and production's own note under the card ("It isn't sent
   *  with your applications") contradicts the API — flagged, not resolved here. */
  cv: {
    label: 'Shared when you apply',
    who: 'Only you can see it here. Hiring teams see it when you apply to one of their roles.',
    icon: 'lock',
  },
  /** `shouldShowInvestorProfile`: owner or admin only on the profile page. The
   *  design's own banner says founders see it when introduced — that is the
   *  audience the label names. */
  investor: {
    label: 'Shared on intro',
    who: 'Only you can see it on your profile. Founders see it when the PL team introduces you.',
    icon: 'lock',
  },
};

/** The page's default audience — said once at the top, so it needs no badges. */
export const DEFAULT_AUDIENCE: AudienceKey = 'members';

/** Who the owner can preview the page as. */
export type Viewer = 'you' | 'member' | 'public';

export const VIEWERS: Array<{ key: Viewer; label: string }> = [
  { key: 'you', label: 'You' },
  { key: 'member', label: 'Member' },
  { key: 'public', label: 'Public' },
];

/** Can this viewer see a section with this audience? The owner sees everything. */
export function canSee(viewer: Viewer, audience: AudienceKey): boolean {
  if (viewer === 'you') return true;
  if (viewer === 'member') return audience === 'public' || audience === 'members';
  return audience === 'public';
}
