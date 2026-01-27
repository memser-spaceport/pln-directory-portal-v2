import { cookies } from 'next/headers';
import { getParsedValue } from './common.utils';
import { customFetch } from '@/utils/fetch-wrapper';

export type ForumErrorInfo = {
  status: string;
  statusText: string;
};

export type ForumFetchResult =
  | { data: Response; error: null }
  | { data: null; error: ForumErrorInfo };

export async function fetchForumActivity(url: string): Promise<ForumFetchResult> {
  const token = process.env.CUSTOM_FORUM_AUTH_TOKEN;

  const cookieStore = await cookies();
  const authToken = getParsedValue(cookieStore.get('authToken')?.value);

  const response = await customFetch(
    url,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
    },
    !token,
  );

  if (!response?.ok) {
    return {
      data: null,
      error: {
        status: String(response?.status ?? 500),
        statusText: response?.statusText ?? 'Unknown error',
      },
    };
  }

  return { data: response, error: null };
}
