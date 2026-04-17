'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

import { useGetGuideComments } from '@/services/guide-comments/hooks/useGetGuideComments';
import type { IUserInfo } from '@/types/shared.types';

import { GuideCommentInput } from './components/GuideCommentInput/GuideCommentInput';
import { GuideCommentItem } from './components/GuideCommentItem/GuideCommentItem';
import s from './GuideComments.module.scss';

interface Props {
  articleUid: string;
  userInfo?: IUserInfo;
}

export const GuideComments = ({ articleUid, userInfo }: Props) => {
  const isAuthenticated = !!userInfo;
  const { data: response, isLoading } = useGetGuideComments(articleUid);

  const comments = useMemo(() => response?.data ?? [], [response?.data]);
  const total = response?.total ?? 0;

  const searchParams = useSearchParams();
  const commentId = searchParams.get('commentId');
  const scrolledToComment = useRef(false);

  const commentListRef = useRef<HTMLDivElement>(null);
  const scrollAfterUpdate = useRef(false);

  useEffect(() => {
    if (!commentId || isLoading || scrolledToComment.current) return;
    if (!document.getElementById(commentId)) return;

    const el = document.getElementById(commentId);

    if (!el) {
      return;
    }

    scrolledToComment.current = true;

    // Defer scroll so that dynamically-loaded content above (MdPreview, images)
    // has time to render and stabilise the layout before we measure position.
    // CSS scroll-margin-top: 140px (globals.scss) handles the sticky-header offset.
    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);

    return () => clearTimeout(timer);
  }, [commentId, isLoading, comments]);

  useEffect(() => {
    if (!scrollAfterUpdate.current) return;
    scrollAfterUpdate.current = false;

    const lastComment = commentListRef.current?.lastElementChild;
    if (!lastComment) return;

    const headerHeight =
      parseInt(getComputedStyle(document.documentElement).getPropertyValue('--app-header-height')) || 56;
    const top = lastComment.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    document.body.scrollTo({ top, behavior: 'smooth' });
  }, [comments]);

  return (
    <section className={s.root}>
      <h2 className={s.heading}>Comments ({total})</h2>

      {isAuthenticated ? (
        <GuideCommentInput
          articleUid={articleUid}
          userInfo={userInfo}
          onCommentAdded={() => {
            scrollAfterUpdate.current = true;
          }}
        />
      ) : (
        <div className={s.signInPrompt}>
          <span>Sign in to leave a comment</span>
        </div>
      )}

      {isLoading && (
        <div className={s.loadingState}>
          <div className={s.skeletonComment} />
          <div className={s.skeletonComment} style={{ width: '80%' }} />
          <div className={s.skeletonComment} style={{ width: '60%' }} />
        </div>
      )}

      {!isLoading && comments.length > 0 && (
        <div className={s.commentList} ref={commentListRef}>
          {comments.map((comment) => (
            <GuideCommentItem
              key={comment.uid}
              comment={comment}
              articleUid={articleUid}
              userInfo={userInfo}
              depth={0}
            />
          ))}
        </div>
      )}
    </section>
  );
};
