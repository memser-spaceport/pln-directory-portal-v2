import type { LabosAgentOpenContext } from '@/types/labos-agent.types';

/** Segments under `/teams` and `/members` that are not a uid. */
const NOT_A_UID = new Set(['add', 'browse']);

/**
 * The page context of the corner and Ctrl/⌘ J (LAB-3302): the page the member is on, for the chip and the C1
 * `context`. `null`: a page the agent does not know, so the panel opens with no chip.
 *
 * - `/?news=<uid>`: the open news story (C1 `news-story`).
 * - `/`: Home (C1 `home`).
 * - `/members/<uid>`: that member. The member's own uid gives `profile`. `/settings/profile` gives `profile` too.
 * - `/teams/<uid>` and its sub-pages: that team.
 * - `/jobs/openings/<uid>`: that job. `/jobs`: the job board, no uid.
 *
 * The labels are page types, not names: the corner has no page data. No member data goes in a label.
 */
export function pageContextFromLocation(
  pathname: string,
  search: string,
  currentUid?: string | null,
): LabosAgentOpenContext | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);

  if (path === '/') {
    const newsUid = new URLSearchParams(search).get('news');
    return newsUid ? { page: 'news-story', newsUid, label: 'News story' } : { page: 'home', label: 'Home' };
  }

  const [first, second, third] = parts;
  if (first === 'settings' && second === 'profile' && parts.length === 2)
    return { page: 'profile', label: 'Your profile' };
  if (first === 'members' && second && !NOT_A_UID.has(second) && parts.length === 2) {
    return currentUid && second === currentUid
      ? { page: 'profile', label: 'Your profile' }
      : { page: 'member', memberUid: second, label: 'Member profile' };
  }
  if (first === 'teams' && second && !NOT_A_UID.has(second))
    return { page: 'team', teamUid: second, label: 'Team page' };
  if (first === 'jobs' && second === 'openings' && third && parts.length === 3) {
    return { page: 'job', jobUid: third, label: 'Job post' };
  }
  if (first === 'jobs' && parts.length === 1) return { page: 'job', label: 'Jobs' };
  return null;
}
