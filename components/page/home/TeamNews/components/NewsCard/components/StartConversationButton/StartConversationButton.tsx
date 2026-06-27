'use client';

import { useRouter } from 'next/navigation';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { useCurrentUserStore } from '@/services/auth/store';
import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { buildForumNewPostUrl } from './utils/buildForumNewPostUrl';
import { hasExistingDiscussion } from './utils/hasExistingDiscussion';
import { stashPendingTargetAndLogin } from './utils/stashPendingTargetAndLogin';

import { ArrowRight } from './components/Icons';
import { Button } from '@/components/common/Button';

import s from './StartConversationButton.module.scss';

interface StartConversationButtonProps {
  item: ITeamNewsItem;
  position: number;
  analyticsSource?: TeamNewsAnalyticsSource;
}

const START_LABEL = 'Discuss';
const JOIN_LABEL = 'Join discussion';
const START_A11Y = 'Start a conversation on the forum';
const JOIN_A11Y = 'Join the existing forum discussion about this article';

export const StartConversationButton = ({ item, position, analyticsSource = 'home' }: StartConversationButtonProps) => {
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

  // Auth users without forum.read are hidden for existing threads — they'd be blocked at the forum gate anyway.
  if (existing && currentUser && !hasAccess) return null;
  // Auth users need forum.write to start a new thread. Unauth users get the affordance with a login handoff.
  if (!existing && currentUser && !canWrite) return null;

  const label = existing ? JOIN_LABEL : START_LABEL;
  const a11y = existing ? JOIN_A11Y : START_A11Y;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const wasAnonymous = !currentUser;

    if (existing) {
      const raw = item.discussion.latestTopicUrl as string;
      const target = raw.startsWith('/forum/') ? raw : null;

      if (!target) {
        return;
      }

      analytics.onTeamNewsJoinDiscussionClicked(item, position, wasAnonymous, analyticsSource);
      if (wasAnonymous) {
        stashPendingTargetAndLogin(router, target);
        return;
      }
      router.push(target);
    } else {
      const target = buildForumNewPostUrl(item);
      analytics.onTeamNewsStartConversationClicked(item, position, wasAnonymous, analyticsSource);
      if (wasAnonymous) {
        stashPendingTargetAndLogin(router, target);
        return;
      }
      router.push(target);
    }
  };

  return (
    <Button
      size="xs"
      style="link"
      variant="primary"
      title={a11y}
      aria-label={a11y}
      onClick={handleClick}
      className={s.discussLink}
    >
      {label}
      <ArrowRight />
    </Button>
  );
};
