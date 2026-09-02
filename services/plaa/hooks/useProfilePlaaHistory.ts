import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';

export interface ProfilePlaaHistoryEntry {
  period: string;
  iaPlaa: number;
  irPlaa: number;
  plaaTotal: number;
}

export const ProfilePlaaHistoryQueryKeys = {
  HISTORY: 'profile-plaa-history',
} as const;

async function fetchProfilePlaaHistory(): Promise<ProfilePlaaHistoryEntry[] | null> {
  const { authToken } = getCookiesFromClient();
  if (!authToken) return null;

  try {
    const res = await fetch('/api/plaa/profile-history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) throw new Error(`Profile history request failed: ${res.status}`);

    return res.json();
  } catch (error) {
    console.error('fetchProfilePlaaHistory error:', error);
    return null;
  }
}

export function useProfilePlaaHistory() {
  return useQuery<ProfilePlaaHistoryEntry[] | null>({
    queryKey: [ProfilePlaaHistoryQueryKeys.HISTORY],
    queryFn: fetchProfilePlaaHistory,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}
