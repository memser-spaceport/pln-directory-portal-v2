import type { IInviteLink, InviteCopyResult } from '@/types/invite.types';
import { customFetch } from '@/utils/fetch-wrapper';

/** Contract agreed with Vova for LAB-3396: signed in only, `{ inviteCode, inviteUrl }`. */
export const MY_INVITE_LINK_PATH = '/v1/members/me/invite-link';

/** Checks the body at the boundary. It returns `inviteUrl` as the API sent it: an absolute http(s) URL. */
export function parseInviteLink(body: unknown): IInviteLink {
  const { inviteCode, inviteUrl } = (body ?? {}) as Record<string, unknown>;
  if (typeof inviteCode !== 'string' || !inviteCode.trim() || typeof inviteUrl !== 'string') {
    throw new Error('Invalid invite link response');
  }
  if (!/^https?:\/\/\S+$/i.test(inviteUrl)) throw new Error('Invalid invite link URL');
  return { inviteCode, inviteUrl };
}

/** Reads the signed-in member's invite link. Call it only with a session. */
export async function getMyInviteLink(): Promise<IInviteLink> {
  const response = await customFetch(`${process.env.DIRECTORY_API_URL}${MY_INVITE_LINK_PATH}`, { method: 'GET' }, true);
  if (!response?.ok) throw new Error(`Failed to fetch the invite link (${response?.status ?? 'no response'})`);
  return parseInviteLink(await response.json());
}

/** If the browser has no clipboard or blocks the write, the result is `fallback`. */
export async function copyInviteLink(
  text: string,
  clipboard?: Pick<Clipboard, 'writeText'>,
): Promise<InviteCopyResult> {
  try {
    if (!clipboard?.writeText) return 'fallback';
    await clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'fallback';
  }
}
