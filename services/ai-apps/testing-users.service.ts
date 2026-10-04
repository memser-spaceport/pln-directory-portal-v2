import { customFetch } from '@/utils/fetch-wrapper';

const AI_APPS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/ai-apps`;

/** Keep in sync with `AI_APPS_TESTING_USERS_MAX_PER_APP` in pln-directory-portal web-api. */
export const AI_APP_TESTING_USERS_MAX = 100;
/** The list endpoint's page size cap (`AI_APPS_TESTING_USERS_PAGE_LIMIT`). */
const LIST_PAGE_LIMIT = 100;
const GENERIC_ERROR = 'Something went wrong. Try again.';

/** A Preview testing user (LAB-2743): name-only, never a member. `revokedAt` is null while active. */
export interface AiAppTestingUser {
  uid: string;
  name: string;
  createdAt: string;
  revokedAt: string | null;
}

/** One minted Preview access string for a testing user (LAB-2744). Returned once; never stored. */
export interface AiAppTestingUserAccess {
  uid: string;
  name: string;
  token: string;
  expiresAt: string;
}

export interface AiAppTestingUsersResult<T> {
  data: T | null;
  error: string | null;
}

async function toError(response: Response | undefined): Promise<string> {
  if (!response) return GENERIC_ERROR;
  if (response.status === 403) return 'Only the app owner or a directory admin can manage testing users.';
  if (response.status === 404) return 'This app or testing user no longer exists.';
  if (response.status === 400 || response.status === 409) {
    try {
      const body = await response.json();
      const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
      if (typeof message === 'string' && message) {
        // The cap refusal names the remaining capacity; say it in the UI's words.
        if (/at most \d+ active testing users/i.test(message)) {
          const remaining = message.match(/create (\d+) more/i)?.[1];
          return remaining
            ? `You can have at most ${AI_APP_TESTING_USERS_MAX} testing users for this app. You can create ${remaining} more.`
            : `You can have at most ${AI_APP_TESTING_USERS_MAX} testing users for this app. Revoke one to create another.`;
        }
        return message;
      }
    } catch {
      // Non-JSON error body — keep the generic message.
    }
  }
  return GENERIC_ERROR;
}

function appUrl(appUid: string, path: string): string {
  return `${AI_APPS_API_URL}/${encodeURIComponent(appUid)}/testing-users${path}`;
}

/** Every testing user of the app, active and revoked, oldest first. Creator or directory admin only. */
export async function fetchAiAppTestingUsers(appUid: string): Promise<AiAppTestingUsersResult<AiAppTestingUser[]>> {
  const items: AiAppTestingUser[] = [];
  // Revoked users stay listed, so an app can hold more than one page.
  for (let page = 1; ; page += 1) {
    const response = await customFetch(
      appUrl(appUid, `?page=${page}&limit=${LIST_PAGE_LIMIT}`),
      { method: 'GET' },
      true,
    );
    if (!response?.ok) return { data: null, error: await toError(response) };
    const body = await response.json();
    const pageItems: AiAppTestingUser[] = Array.isArray(body?.items) ? body.items : [];
    items.push(...pageItems);
    const total = typeof body?.total === 'number' ? body.total : items.length;
    if (pageItems.length === 0 || items.length >= total) break;
  }
  return { data: items, error: null };
}

/** Creates `count` (1 to 100) testing users, all or nothing. */
export async function createAiAppTestingUsers(
  appUid: string,
  count: number,
): Promise<AiAppTestingUsersResult<AiAppTestingUser[]>> {
  const response = await customFetch(
    appUrl(appUid, ''),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count }) },
    true,
  );
  if (!response?.ok) return { data: null, error: await toError(response) };
  const body = await response.json();
  return { data: Array.isArray(body?.items) ? body.items : [], error: null };
}

/** Revokes one testing user (idempotent); its Preview access stops working. */
export async function revokeAiAppTestingUser(
  appUid: string,
  testingUserUid: string,
): Promise<AiAppTestingUsersResult<{ uid: string; revokedAt: string }>> {
  const response = await customFetch(
    appUrl(appUid, `/${encodeURIComponent(testingUserUid)}/revoke`),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    true,
  );
  if (!response?.ok) return { data: null, error: await toError(response) };
  const body = await response.json();
  return {
    data: { uid: body?.uid ?? testingUserUid, revokedAt: body?.revokedAt ?? new Date().toISOString() },
    error: null,
  };
}

/**
 * Mints one Preview access string per active testing user (all of them when `uids` is omitted).
 * The caller shows them once and keeps them only in component memory: never in a query cache or storage.
 */
export async function mintAiAppTestingUserAccess(
  appUid: string,
  uids?: string[],
): Promise<AiAppTestingUsersResult<AiAppTestingUserAccess[]>> {
  const response = await customFetch(
    appUrl(appUid, '/sessions'),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(uids ? { uids } : {}) },
    true,
  );
  if (!response?.ok) return { data: null, error: await toError(response) };
  const body = await response.json();
  return { data: Array.isArray(body?.items) ? body.items : [], error: null };
}
