import { IJobRole } from '@/types/jobs.types';

const UTM = 'utm_source=os.pl.xyz&utm_medium=job_board';

/**
 * The role's apply link, tagged so applications arriving through a referral are
 * attributable to the job board.
 *
 * Roles with no link on record (`applyUrl` is nullable) get no line in the note at all,
 * rather than a dead "The role:" label. A link that already carries a `utm_source` is
 * left alone — two of them in one URL is worse than none.
 */
export function getRoleUrl(role: IJobRole): string {
  const applyUrl = role.applyUrl?.trim();

  if (!applyUrl) return '';
  if (applyUrl.includes('utm_source=')) return applyUrl;

  // A URL ending in a bare `?` or `&` already has its separator; appending another
  // would produce `...?&utm_source=`.
  const base = applyUrl.replace(/[?&]$/, '');

  return `${base}${base.includes('?') ? '&' : '?'}${UTM}`;
}
