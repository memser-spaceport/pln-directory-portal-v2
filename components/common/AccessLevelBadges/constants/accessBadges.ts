import type { AccessBadgeContent, MemberState } from '../types/accessBadges';

export const MEMBER_STATE_BADGES: Partial<Record<MemberState, AccessBadgeContent>> = {
  PENDING: {
    label: 'L0 · Not approved',
    description: 'Waiting for admin approval. The member has not been verified or approved yet.',
    variant: 'warning',
  },
  VERIFIED: {
    label: 'L1 · Limited access',
    description: 'Verified but not approved yet. The member has limited access to the directory.',
    variant: 'brand',
  },
  REJECTED: {
    label: 'Rejected',
    description: 'An admin rejected this member. The profile is hidden from the directory.',
    variant: 'error',
  },
};

export const TEAM_LEVEL_BADGES: Partial<Record<string, AccessBadgeContent>> = {
  L0: {
    label: 'L0 · Hidden',
    description:
      'Hidden from the Teams list and from logged-out visitors: a new team waiting for approval, a deleted team, or a team whose members have never logged in.',
    variant: 'warning',
  },
  L1: {
    label: 'L1 · Base level',
    description:
      'Base team level, listed in the directory. A team gets it once one of its members logs in, or when an admin or an approved member adds it.',
    variant: 'brand',
  },
};

export const JOB_ASPIRANT_BADGE: AccessBadgeContent = {
  label: 'Job Aspirant',
  description: 'Signed up through the Job Board without joining a team.',
  variant: 'default',
};
