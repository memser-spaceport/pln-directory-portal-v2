import type { IJobTeam } from '@/types/jobs.types';

/**
 * Protocol Labs' own team record.
 *
 * Transcribed from the backend's `team-news-public-list.config`, which is where
 * the uid is already hard-coded and where `isProtocolLabsTeam` already lives
 * (`job-openings/pin-protocol-labs-team.ts`, used to pin PL first on the board).
 * Two copies of one uid is not ideal; one copy and a guess at the other end
 * would be worse, and the board already depends on the backend's answer being
 * this one.
 */
const PROTOCOL_LABS_TEAM_UID = 'cldvnyxaf01ynu21k62uopjvg';
const PROTOCOL_LABS_TEAM_NAME = 'protocol labs';

/**
 * Is this role posted by Protocol Labs itself?
 *
 * **The name fallback is deliberate, and it is the backend's own.** A uid is
 * exact but environment-specific: dev, UAT and production each seed their own
 * teams, so a strict uid match would silently misclassify PL roles anywhere the
 * seed differs — and misclassifying means sending an applicant off-site when the
 * board meant to keep them. The name is the wider net that catches that case;
 * the uid is what makes the common case exact.
 */
export const isProtocolLabsTeam = (team: Pick<IJobTeam, 'uid' | 'name'> | null | undefined): boolean => {
  if (!team) return false;
  if (team.uid === PROTOCOL_LABS_TEAM_UID) return true;
  return team.name?.trim().toLowerCase() === PROTOCOL_LABS_TEAM_NAME;
};
