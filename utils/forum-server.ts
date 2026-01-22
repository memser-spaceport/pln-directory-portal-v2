import { cookies } from 'next/headers';
import { getParsedValue } from './common.utils';
import { customFetch } from '@/utils/fetch-wrapper';

export async function fetchForumActivity(url: string) {
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
    throw new Error(`${response?.status}: ${response?.statusText}`);
  }

  return response;
}
