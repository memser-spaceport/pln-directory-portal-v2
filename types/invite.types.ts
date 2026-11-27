/** The signed-in member's invite link (LAB-3398). The backend owns the code and the URL (LAB-3396). */
export interface IInviteLink {
  inviteCode: string;
  inviteUrl: string;
}

/** `fallback`: the copy failed, so the member copies the link by hand. */
export type InviteCopyResult = 'copied' | 'fallback';
