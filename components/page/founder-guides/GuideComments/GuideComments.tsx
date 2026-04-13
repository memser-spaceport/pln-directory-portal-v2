'use client';

import React, { useEffect, useMemo, useRef } from 'react';

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

  const commentListRef = useRef<HTMLDivElement>(null);
  const scrollAfterUpdate = useRef(false);

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
