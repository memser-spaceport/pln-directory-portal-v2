import Link from 'next/link';

import s from './MembersInvitePrompt.module.scss';

interface Props {
  /** The member search text (`searchBy`). */
  searchBy?: string | string[];
  isUserLoggedIn?: boolean;
  resultsCount: number;
}

/** True only for a signed-in viewer after a search with no results (LAB-3398 R6). */
export function showsMembersInvitePrompt({ searchBy, isUserLoggedIn, resultsCount }: Props): boolean {
  const query = Array.isArray(searchBy) ? searchBy.join(' ') : (searchBy ?? '');
  return !!isUserLoggedIn && query.trim().length > 0 && resultsCount === 0;
}

/** The line under the members empty result. It opens Settings → Invite. */
export function MembersInvitePrompt(props: Props) {
  if (!showsMembersInvitePrompt(props)) return null;

  return (
    <p className={s.root} data-testid="members-invite-prompt">
      Can’t find them? They may not be on LabOS yet.{' '}
      <Link href="/settings/invite" className={s.link}>
        Invite them.
      </Link>
    </p>
  );
}
