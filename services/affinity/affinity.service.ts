import { customFetch } from '@/utils/fetch-wrapper';
import { AffinityMemberResponse } from './types';

export async function getAffinityMember(uid: string): Promise<AffinityMemberResponse | null> {
  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/affinity/members/${uid}`,
    { method: 'GET', headers: { 'Content-Type': 'application/json' } },
    true,
  );
  if (!response) return null;
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to fetch affinity data');
  return response.json();
}
