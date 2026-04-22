import { useQuery } from '@tanstack/react-query';
import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { fetchMyAccess } from '@/services/access-control/access-control.service';
import { getUserInfoFromLocal } from '@/utils/common.utils';

// Interim derivation: investor = has member.contacts.read but lacks forum.read.
// TODO: replace with an explicit investor permission once backend adds one.
export function useInvestorAccess() {
  const userInfo = getUserInfoFromLocal();

  const {
    data: isInvestor = false,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [AccessControlQueryKeys.MY_ACCESS],
    queryFn: fetchMyAccess,
    select: (data) =>
      !data.effectivePermissions.includes('forum.read') &&
      data.effectivePermissions.includes('member.contacts.read'),
    staleTime: 5 * 60 * 1000,
    enabled: !!userInfo,
    retry: 2,
  });

  return { isInvestor, isLoading, isError };
}
