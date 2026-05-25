import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import type { ICreateTeamNewsDiscussionRequest, ICreateTeamNewsDiscussionResponse } from '@/types/team-news.types';

async function createTeamNewsDiscussionLink(
  newsItemUid: string,
  payload: ICreateTeamNewsDiscussionRequest,
): Promise<ICreateTeamNewsDiscussionResponse | null> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/team-news/${encodeURIComponent(newsItemUid)}/discussions`;
  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    true,
  );
  if (!response?.ok) {
    return null;
  }
  return (await response.json()) as ICreateTeamNewsDiscussionResponse;
}

export function useCreateTeamNewsDiscussionLink() {
  return useMutation({
    mutationFn: ({
      newsItemUid,
      payload,
    }: {
      newsItemUid: string;
      payload: ICreateTeamNewsDiscussionRequest;
    }) => createTeamNewsDiscussionLink(newsItemUid, payload),
  });
}
