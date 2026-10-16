'use client';

import { useCurrentUserStore } from '@/services/auth/store';
import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';

import ActiveMemberOverview, { ActiveMemberOverviewProps } from './active-member-overview';
import ProspectiveVisitorOverview from './prospective-visitor-overview';

export default function OverviewPage(props: ActiveMemberOverviewProps) {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { canView, isLoading } = usePlaaAccess();

  const isPersonaPending = !isHydrated || (currentUser && isLoading);
  if (isPersonaPending) {
    return null;
  }

  if (currentUser && canView) {
    return <ActiveMemberOverview {...props} />;
  }
  return <ProspectiveVisitorOverview trustHoldings={props.trustHoldings} />;
}
