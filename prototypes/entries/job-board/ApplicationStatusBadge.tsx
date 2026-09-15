'use client';

import { Badge } from '@/components/common/Badge';

import { APPLICATION_STATUS_LABEL, type ApplicationStatus } from './applicationStatus';

/**
 * The status pill an application wears — on its row and in the drawer's
 * masthead, so the two hosts cannot drift. The applicant's counterpart of
 * `ListingStatusBadge`: same DS `Badge`, same slot on the row, same slot in the
 * stamp row, so a status is one kind of thing on this board whoever it belongs
 * to.
 *
 * Renders nothing for `sent`. That is the resting state and the clock already
 * says it ("Applied 2d ago"); the pill exists to report that something has
 * happened since (see `ApplicationStatus`).
 *
 * `brand` for viewed rather than `success`: the team looking is news, not an
 * outcome, and green on this board means *live*. `default` for closed — the
 * same grey production's `Inactive` wears, because it is the same fact about
 * the same listing seen from the other side.
 */
export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  if (status === 'sent') return null;
  return <Badge variant={status === 'viewed' ? 'brand' : 'default'}>{APPLICATION_STATUS_LABEL[status]}</Badge>;
}
