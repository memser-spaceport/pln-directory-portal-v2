import { customFetch } from '@/utils/fetch-wrapper';

export async function followTeam(teamUid: string): Promise<void> {
  await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/teams/${encodeURIComponent(teamUid)}/follow`,
    { method: 'POST' },
    true,
  );
}

export async function unfollowTeam(teamUid: string): Promise<void> {
  await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/teams/${encodeURIComponent(teamUid)}/follow`,
    { method: 'DELETE' },
    true,
  );
}
