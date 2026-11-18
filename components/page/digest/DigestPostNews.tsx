'use client';

import { useEffect, useState } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { isPrivyOAuthReturn } from '@/components/core/login/utils/privyOAuthReturn';
import { toast } from '@/components/core/ToastContainer';
import { resolvePrimaryTeam } from '@/components/page/member-details/utils/resolvePrimaryTeam';
import { PostNewsModal } from '@/components/page/team-details/TeamNews/PostNewsModal';
import { useCurrentUserStore } from '@/services/auth/store';
import { useMember } from '@/services/members/hooks/useMember';
import { useCreateTeamNewsPost } from '@/services/team-news/hooks/useCreateTeamNewsPost';
import type { IMember } from '@/types/members.types';

import { DigestTeamNewsCard } from './DigestIssueEnd';

type Props = {
  /** Open the modal on load: the email's "Post your team news →" lands with `?postnews=open`. */
  openOnLoad: boolean;
  onSignIn: () => void;
};

/**
 * "Got news from your team?" with its Post news modal (LAB-3287). Posting needs the signed-in member and their team:
 * a signed-out reader goes to sign-in first; the team is the member's main team, else their only team, else their
 * first one. The modal opens once the member's team has loaded.
 */
export function DigestPostNews({ openOnLoad, onSignIn }: Props) {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const analytics = useTeamNewsAnalytics();
  const [requested, setRequested] = useState(openOnLoad);
  const { data } = useMember(requested ? currentUser?.uid : undefined);
  const member = data && 'memberInfo' in data ? (data.memberInfo as IMember | undefined) : undefined;
  const team = teamOf(member);
  const createPost = useCreateTeamNewsPost(team?.uid ?? '');

  // The email link lands signed out: sign in first, then the address (still `?postnews=open`) opens the modal. Not on
  // the way back from Google or GitHub: starting a sign-in again would throw away the one that is finishing (LAB-3308).
  useEffect(() => {
    if (openOnLoad && isHydrated && !currentUser && !isPrivyOAuthReturn()) onSignIn();
  }, [openOnLoad, isHydrated, currentUser, onSignIn]);

  const onPost = () => {
    if (!isHydrated) return;
    if (!currentUser) return onSignIn();
    setRequested(true);
  };

  return (
    <>
      <DigestTeamNewsCard
        onPost={onPost}
        note={requested && member && !team ? 'Your profile has no team to post for yet.' : null}
      />
      {team && (
        <PostNewsModal
          open={requested && Boolean(currentUser)}
          onClose={() => setRequested(false)}
          teamUid={team.uid}
          teamName={team.name}
          existing={[]}
          isPublishing={createPost.isPending}
          onPublish={async (post) => {
            await createPost.mutateAsync({ title: post.title, body: post.body || undefined, url: post.url });
            analytics.onTeamNewsCreatePostSubmitted(team.uid, team.name, 'digest');
            toast.success('Posted. It’s on the network feed now.');
          }}
        />
      )}
    </>
  );
}

function teamOf(member: IMember | undefined): { uid: string; name: string } | null {
  if (!member) return null;
  const primary = resolvePrimaryTeam(member);
  if (primary) return primary;
  const first = member.teams?.find((t) => t.id?.trim());
  return first ? { uid: first.id.trim(), name: first.name?.trim() || '' } : null;
}
