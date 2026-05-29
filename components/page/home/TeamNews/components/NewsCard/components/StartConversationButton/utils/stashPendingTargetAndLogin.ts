import { useRouter } from 'next/navigation';

import { NEWS_JOIN_DISCUSSION_PENDING_KEY } from '../constants';

export function stashPendingTargetAndLogin(router: ReturnType<typeof useRouter>, targetUrl: string) {
  try {
    window.sessionStorage.setItem(NEWS_JOIN_DISCUSSION_PENDING_KEY, targetUrl);
  } catch {
    // sessionStorage unavailable — fall through to the login modal without the
    // handoff; user lands back on /home after login.
  }
  router.push(`${window.location.pathname}${window.location.search}#login`);
}
