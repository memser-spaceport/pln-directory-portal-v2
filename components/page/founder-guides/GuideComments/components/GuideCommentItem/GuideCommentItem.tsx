'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import parse from 'html-react-parser';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@base-ui-components/react/avatar';
import React, { useState } from 'react';

import { CommentIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { useDeleteGuideComment } from '@/services/guide-comments/hooks/useDeleteGuideComment';
import type { IUserInfo } from '@/types/shared.types';
import type { NestedGuideComment } from '@/services/guide-comments/guide-comments.types';

import { GuideCommentInput } from '../GuideCommentInput/GuideCommentInput';
import { GuideCommentLikeButton } from '../GuideCommentLikeButton/GuideCommentLikeButton';
import { GuideCommentItemMenu } from '../GuideCommentItemMenu/GuideCommentItemMenu';

import s from './GuideCommentItem.module.scss';

const MAX_DEPTH = 2;
const VISIBLE_REPLY_COUNT = 2;

interface Props {
  comment: NestedGuideComment;
  articleUid: string;
  userInfo?: IUserInfo;
  depth?: number;
}

export const GuideCommentItem = ({ comment, articleUid, userInfo, depth = 0 }: Props) => {
  const isReply = depth > 0;
  const canReply = depth < MAX_DEPTH;
  const isAuthenticated = !!userInfo;
  const isOwn = userInfo ? userInfo.uid === comment.authorMember.uid || isAdminUser(userInfo) : false;

  const [replyToUid, setReplyToUid] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMoreReplies, setShowMoreReplies] = useState(false);

  const deleteComment = useDeleteGuideComment();

  const visibleReplies = showMoreReplies ? comment.replies : comment.replies.slice(0, VISIBLE_REPLY_COUNT);
  const hiddenCount = comment.replies.length - VISIBLE_REPLY_COUNT;
  const hasMoreReplies = !showMoreReplies && hiddenCount > 0;

  const avatarSrc = comment.authorMember.imageUrl ?? getDefaultAvatar(comment.authorMember.name);

  return (
    <>
      <div className={clsx(s.itemRoot, { [s.reply]: isReply })} data-uid={comment.uid}>
        {/* Header row */}
        <div className={s.header}>
          <Link href={`/members/${comment.authorMember.uid}`} onClick={(e) => e.stopPropagation()}>
            <Avatar.Root className={s.avatar}>
              <Avatar.Image src={avatarSrc} width="32" height="32" className={s.avatarImage} />
              <Avatar.Fallback className={s.avatarFallback}>
                {comment.authorMember.name.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>
          </Link>
          <div className={s.meta}>
            <Link href={`/members/${comment.authorMember.uid}`} className={s.name} onClick={(e) => e.stopPropagation()}>
              {comment.authorMember.name}
            </Link>
            {comment.authorMember.mainTeamTitle && (
              <span className={s.role}>· {comment.authorMember.mainTeamTitle}</span>
            )}
            <span className={s.time}>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
          </div>
          {isOwn && (
            <div className={s.menuWrapper}>
              <GuideCommentItemMenu
                onEdit={() => setIsEditing(true)}
                onDelete={() => deleteComment.mutate({ articleUid, commentUid: comment.uid })}
              />
            </div>
          )}
        </div>

        {/* Body */}
        {isEditing ? (
          <GuideCommentInput
            articleUid={articleUid}
            userInfo={userInfo!}
            commentUid={comment.uid}
            isEdit
            initialContent={comment.content}
            initialFocused
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className={s.body}>{parse(comment.content)}</div>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className={s.actions}>
            <GuideCommentLikeButton
              commentUid={comment.uid}
              articleUid={articleUid}
              totalLikes={comment.totalLikes}
              isLiked={comment.isLiked}
              isAuthenticated={isAuthenticated}
            />
            {canReply && (
              <>
                <div className={s.actionItem}>
                  <CommentIcon />
                  {comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}
                </div>
                {isAuthenticated && (
                  <button className={s.replyBtn} onClick={() => setReplyToUid(comment.uid)}>
                    Reply
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Inline reply input */}
      {replyToUid && userInfo && (
        <div className={s.replyInputWrapper}>
          <GuideCommentInput
            articleUid={articleUid}
            userInfo={userInfo}
            parentUid={comment.uid}
            replyToName={comment.authorMember.name}
            initialFocused
            onCancel={() => setReplyToUid(null)}
          />
        </div>
      )}

      {/* Nested replies */}
      {visibleReplies.length > 0 && (
        <div className={s.repliesWrapper}>
          {visibleReplies.map((reply) => (
            <GuideCommentItem
              key={reply.uid}
              comment={reply}
              articleUid={articleUid}
              userInfo={userInfo}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* View more replies */}
      {hasMoreReplies && (
        <button className={s.viewMoreBtn} onClick={() => setShowMoreReplies(true)}>
          View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
        </button>
      )}
    </>
  );
};
