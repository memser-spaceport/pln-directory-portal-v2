import { IMember } from '@/types/members.types';

import { useOfficeHoursAccess } from '@/services/access-control/hooks/useOfficeHoursAccess';

interface Input {
  member: IMember;
  offerBooking: boolean;
}

export function useMemberContactAction(input: Input): 'schedule' | 'intro' | null {
  const { member, offerBooking } = input;
  const { canViewDemand, isLoading } = useOfficeHoursAccess();

  if (!offerBooking || !member.officeHours) {
    return 'intro';
  }

  // Wait for access before choosing, so an intro never flashes in before Schedule Meeting.
  if (isLoading) {
    return null;
  }

  return canViewDemand ? 'schedule' : 'intro';
}
