import { cookies } from 'next/headers';

import { getParsedValue } from './common.utils';
import { AUTH_COOKIE_NAMES } from './cookie.utils';

export type ForumErrorInfo = {
  status: string;
  statusText: string;
};

export type ForumFetchResult = { data: Response; error: null } | { data: null; error: ForumErrorInfo };

export async function fetchForumActivity(url: string): Promise<ForumFetchResult> {
  const cookieStore = await cookies();
  const authToken = getParsedValue(cookieStore.get(AUTH_COOKIE_NAMES.authToken)?.value);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    credentials: 'include',
  });

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
