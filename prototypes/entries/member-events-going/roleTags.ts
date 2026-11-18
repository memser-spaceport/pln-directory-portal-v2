import tiles from '../team-profile/TeamContributions.module.scss';

/**
 * The muted role tags (Host violet, Speaker green, Sponsor brand) the profile's Events and
 * Contributions use. Shared so the event drawer's and the gathering modal's "Who's going" lists
 * draw roles the same way (2026-11-18: they were brand Badges / a local tag).
 * Use as `clsx(ROLE_TAG, MUTED_ROLE[role])`.
 */
export const ROLE_TAG = tiles.roleTag;

export const MUTED_ROLE: Record<string, string> = {
  Host: tiles.roleTagMutedHost,
  Speaker: tiles.roleTagMutedSpeaker,
  Sponsor: tiles.roleTagMutedSponsor,
};
