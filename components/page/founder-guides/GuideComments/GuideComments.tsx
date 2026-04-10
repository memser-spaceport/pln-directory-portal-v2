'use client';

import React from 'react';

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

  const comments = response?.data ?? [];
  const total = response?.total ?? 0;

  return (
    <section className={s.root}>
      <h2 className={s.heading}>Comments ({total})</h2>

      {isAuthenticated ? (
        <GuideCommentInput articleUid={articleUid} userInfo={userInfo} />
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

      {!isLoading && comments.length === 0 && (
        <p className={s.emptyState}>Be the first to comment on this guide.</p>
      )}

      {!isLoading && comments.length > 0 && (
        <div className={s.commentList}>
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
