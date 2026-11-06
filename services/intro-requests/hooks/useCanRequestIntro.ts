'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { useIsInfraMember } from '@/services/plaa/hooks/useIsInfraMember';

import { hasCurrentPortfolioRole } from '../intro-request-eligibility';
import { fetchPortfolioTeamsForMember } from '../intro-requests.service';

export function useCanRequestIntro(): boolean {
  const { currentUser } = useCurrentUserStore();
  const memberUid = currentUser?.uid;
  const isInfra = useIsInfraMember();

  const portfolio = useQuery({
    queryKey: ['intro-requests', 'portfolio-teams', memberUid],
    queryFn: () => fetchPortfolioTeamsForMember(memberUid!),
    enabled: !!memberUid,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (!memberUid) return false;
  if (isInfra) return true;
  if (!portfolio.isSuccess) return false;
  return hasCurrentPortfolioRole(portfolio.data, memberUid);
}
