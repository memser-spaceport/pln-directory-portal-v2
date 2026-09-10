'use client';

import { Badge } from '@/components/common/Badge';

import { LISTING_STATUS_LABEL, type ListingStatus } from './listings';

/**
 * The status pill a managed listing wears — on its row and in the drawer's
 * masthead, so the two hosts cannot drift.
 *
 * The DS `Badge`, not a hand-rolled pill: production's own "Inactive" mark on a
 * team profile is `<Badge>Inactive</Badge>` (`TeamDetails.tsx`), so an inactive
 * listing wears the same word in the same component. The other two take the
 * Badge's own semantic variants — `warning` for a listing waiting on someone,
 * `success` for one that is up — rather than inventing colours.
 */
export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const variant = status === 'live' ? 'success' : status === 'in-review' ? 'warning' : 'default';
  return <Badge variant={variant}>{LISTING_STATUS_LABEL[status]}</Badge>;
}
