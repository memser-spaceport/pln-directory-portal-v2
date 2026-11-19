'use client';

import { useState } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { toast } from '@/components/core/ToastContainer';
import {
  PostNewsButton,
  PostNewsModal,
  type PostNewsSubmission,
} from '@/components/page/team-details/TeamNews/PostNewsModal';
import { useCreateTeamNewsPost } from '@/services/team-news/hooks/useCreateTeamNewsPost';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { useLeadTeams } from './useLeadTeams';
import s from './HomePostNews.module.scss';

interface Props {
  /** The stories on the page, for the form's duplicate-link check. */
  existing: ITeamNewsItem[];
  /** The new story, after a successful post: Home puts it first in the stream. */
  onPosted: (item: ITeamNewsItem) => void;
}

/**
 * \"Post news\" at the end of the Network Updates header (LAB-3342, design LAB-3316). Team leads only: anyone else
 * (a member or an admin who leads no team) gets nothing, so the header keeps only the search.
 *
 * The production team-page button and form. One team: the form is for it. More: \"Post as\" on top, on the main team.
 */
export function HomePostNews({ existing, onPosted }: Props) {
  const { teams, initialTeamUid } = useLeadTeams();
  const analytics = useTeamNewsAnalytics();
  const [open, setOpen] = useState(false);
  const createPost = useCreateTeamNewsPost(initialTeamUid);

  if (teams.length === 0) return null;

  const initialTeam = teams.find((t) => t.uid === initialTeamUid) ?? teams[0];
  const nameOf = (uid: string) => teams.find((t) => t.uid === uid)?.name ?? '';

  const openForm = () => {
    analytics.onTeamNewsCreateClicked(initialTeam.uid, initialTeam.name, 'home');
    setOpen(true);
  };

  const publish = async (post: PostNewsSubmission) => {
    try {
      const item = await createPost.mutateAsync({
        teamUid: post.teamUid,
        title: post.title,
        body: post.body || undefined,
        url: post.url,
      });
      analytics.onTeamNewsCreatePostSubmitted(post.teamUid, nameOf(post.teamUid), 'home');
      onPosted(item);
      toast.success(`Posted as ${nameOf(post.teamUid)}. It’s on the network feed now.`);
    } catch (error) {
      // A duplicate link shows on the Link field (the form's own check). Anything else: the service's message.
      const message = error instanceof Error ? error.message : 'Failed to post team news';
      if (!message.toLowerCase().includes('already in')) toast.error(message);
      throw error;
    }
  };

  return (
    <>
      <PostNewsButton teamName={initialTeam.name} onPost={openForm} showTip={false} className={s.homePostAction} />
      <PostNewsModal
        open={open}
        onClose={() => setOpen(false)}
        teamUid={initialTeam.uid}
        teamName={initialTeam.name}
        teamChoices={teams}
        existing={existing}
        onPublish={publish}
        isPublishing={createPost.isPending}
      />
    </>
  );
}
