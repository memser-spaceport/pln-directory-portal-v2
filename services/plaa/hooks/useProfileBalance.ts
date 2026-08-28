import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';

export interface ProfileBalanceResponse {
  plaaBalance: number;
  activities: number;
  infraRewards: number;
  redeemed: number;
}

export const ProfileBalanceQueryKeys = {
  BALANCE: 'profile-balance',
} as const;

async function fetchProfileBalance(): Promise<ProfileBalanceResponse | null> {
  const { authToken } = getCookiesFromClient();
  if (!authToken) return null;

  try {
    const res = await fetch('/api/plaa/profile-balance', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.status === 401 || res.status === 403 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Profile balance request failed: ${res.status}`);

    return res.json();
  } catch (error) {
    console.error('fetchProfileBalance error:', error);
    return null;
  }
}

export function useProfileBalance() {
  return useQuery<ProfileBalanceResponse | null>({
    queryKey: [ProfileBalanceQueryKeys.BALANCE],
    queryFn: fetchProfileBalance,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
