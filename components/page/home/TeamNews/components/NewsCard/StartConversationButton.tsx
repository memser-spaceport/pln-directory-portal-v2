'use client';

import { useRouter } from 'next/navigation';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { useCurrentUserStore } from '@/services/auth/store';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import type { ITeamNewsDiscussion, ITeamNewsItem } from '@/types/team-news.types';

import s from './StartConversationButton.module.scss';

interface StartConversationButtonProps {
  item: ITeamNewsItem;
  position: number;
}

const FORUM_TOPIC = 'General';
const START_LABEL = 'Discuss';
const JOIN_LABEL = 'Join discussion';
const START_A11Y = 'Start a conversation on the forum';
const JOIN_A11Y = 'Join the existing forum discussion about this article';

// sessionStorage handoff used when an unauth visitor clicks Discuss or Join
// discussion: stash the target URL, trigger the login modal, and a post-login
// effect on /home (NewsLoginRedirect) reads the key and pushes them through.
// One shared key covers both affordances — last click wins.
export const NEWS_JOIN_DISCUSSION_PENDING_KEY = 'teamNewsJoinDiscussion:pendingTarget';

const stashPendingTargetAndLogin = (router: ReturnType<typeof useRouter>, targetUrl: string) => {
  try {
    window.sessionStorage.setItem(NEWS_JOIN_DISCUSSION_PENDING_KEY, targetUrl);
  } catch {
    // sessionStorage unavailable — fall through to the login modal without the
    // handoff; user lands back on /home after login.
  }
  router.push(`${window.location.pathname}${window.location.search}#login`);
};

const buildForumNewPostUrl = (item: ITeamNewsItem): string => {
  const params = new URLSearchParams({
    title: item.title,
    url: item.sourceUrl,
    topic: FORUM_TOPIC,
    newsItemUid: item.uid,
  });
  return `/forum/posts/new?${params.toString()}`;
};

const hasExistingDiscussion = (d: ITeamNewsDiscussion): d is ITeamNewsDiscussion & { latestTopicUrl: string } =>
  d.count > 0 && !!d.latestTopicUrl;

export const StartConversationButton = ({ item, position }: StartConversationButtonProps) => {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { hasAccess, canWrite, isLoading } = useForumAccess();
  const analytics = useTeamNewsAnalytics();

  if (!isHydrated) return null;
  // While forum access is loading we don't render the Join link for auth users
  // (avoids a flash if the user turns out to lack forum.read). Unauth users
  // never hit this query, so they're unaffected.
  if (currentUser && isLoading) return null;

  const existing = hasExistingDiscussion(item.discussion);

  // Prefer surfacing an existing thread to a new "Discuss" affordance.
  if (existing) {
    // Auth users without forum.read are hidden — they'd be blocked at the
    // forum gate anyway. Unauth users get the link and a login handoff.
    if (currentUser && !hasAccess) return null;

    const handleJoin = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const wasAnonymous = !currentUser;
      const raw = item.discussion.latestTopicUrl as string;
      const target = raw.startsWith('/forum/') ? raw : null;
      if (!target) return;
      analytics.onTeamNewsJoinDiscussionClicked(item, position, wasAnonymous);

      if (wasAnonymous) {
        stashPendingTargetAndLogin(router, target);
        return;
      }
      router.push(target);
    };

    return (
      <>
        <span className={s.sep} aria-hidden="true" />
        <button type="button" className={s.discussLink} onClick={handleJoin} aria-label={JOIN_A11Y} title={JOIN_A11Y}>
          {JOIN_LABEL}
        </button>
      </>
    );
  }

  // No existing thread. Auth users need forum.write to start one. Unauth users
  // are shown the affordance too — click triggers login, and after login the
  // ForumWriteGate on /forum/posts/new will handle the case where they lack
  // permission (showing the informational gate, not a dead-end).
  if (currentUser && !canWrite) return null;

  const handleStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const wasAnonymous = !currentUser;
    const target = buildForumNewPostUrl(item);
    analytics.onTeamNewsStartConversationClicked(item, position, wasAnonymous);

    if (wasAnonymous) {
      stashPendingTargetAndLogin(router, target);
      return;
    }
    router.push(target);
  };

  return (
    <>
      <span className={s.sep} aria-hidden="true" />
      <button type="button" className={s.discussLink} onClick={handleStart} aria-label={START_A11Y} title={START_A11Y}>
        {START_LABEL}
      </button>
    </>
  );
};
