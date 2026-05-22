'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserStore } from '@/services/auth/store';
import { NEWS_JOIN_DISCUSSION_PENDING_KEY } from './components/NewsCard/StartConversationButton';

/**
 * Post-login redirect handler for the news-feed "Join discussion" flow.
 *
 * When an unauth visitor clicks Join discussion on a card, the button stashes
 * the target topic URL in sessionStorage and triggers the Privy login modal.
 * After the user successfully signs in, they land back on /home; this
 * component reads the stashed URL, clears it, and pushes the user through
 * to the thread.
 *
 * Mounted once at the page level. Reads / writes nothing visible.
 */
export const NewsLoginRedirect = () => {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const consumedRef = useRef(false);

  useEffect(() => {
    if (consumedRef.current) return;
    if (!isHydrated || !currentUser) return;
    let target: string | null = null;
    try {
      target = window.sessionStorage.getItem(NEWS_JOIN_DISCUSSION_PENDING_KEY);
      if (target) {
        window.sessionStorage.removeItem(NEWS_JOIN_DISCUSSION_PENDING_KEY);
      }
    } catch {
      // sessionStorage unavailable — nothing to do.
    }
    if (target) {
      consumedRef.current = true;
      router.push(target);
    }
  }, [currentUser, isHydrated, router]);

  return null;
};
