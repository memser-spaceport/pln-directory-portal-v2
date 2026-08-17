import { useMedia } from 'react-use';
import React from 'react';

import { TopicResponse } from '@/services/forum/hooks/useForumPost';
import { CommentsInputDesktop } from '@/components/page/forum/CommentsInputDesktop';
import { IUserInfo } from '@/types/shared.types';

import { nestComments } from './utils/nestComments';
import { CommentItem } from './components/CommentItem';

import s from './PostComments.module.scss';

interface Props {
  tid: number;
  mainPid: number;
  comments: TopicResponse['posts'] | undefined;
  /**
   * The topic's own reply count (`postcount - 1`) — the same number the post's
   * stats row shows. NodeBB serves one page of posts per request, so it can
   * exceed what `comments` holds; heading off that gap is the whole reason this
   * is passed in rather than derived from the list.
   */
  total?: number;
  onReply?: (id: number) => void;
  userInfo: IUserInfo;
  timestamp: number;
}

export const PostComments = ({ comments, total, tid, mainPid, onReply, userInfo, timestamp }: Props) => {
  const isMobile = useMedia('(max-width: 960px)', false);
  const canWrite = userInfo?.rbac?.effectivePermissions.some((p) => p.code === 'forum.write');

  if (!comments) return null;

  const nested = nestComments(comments);

  // The heading counts the DISCUSSION, not the page of it that arrived — the
  // stats row above already reports the topic's own total, and two "Comments"
  // numbers disagreeing on one screen is the defect this fixes. Floored at the
  // loaded length so a stale postcount can never claim fewer replies than are
  // visibly listed below it.
  const loaded = comments.length;
  const shown = typeof total === 'number' ? Math.max(total, loaded) : loaded;
  // Saying 48 over a list of 19 would be a worse lie than the mismatch was:
  // this page has no pagination, so without a word about the gap the missing
  // replies simply look lost.
  const missing = shown - loaded;

  return (
    <div className={s.root}>
      <div className={s.title}>Comments ({shown})</div>

      {canWrite && (
        <div className={s.input}>
          <CommentsInputDesktop tid={tid} toPid={mainPid} timestamp={timestamp} />
        </div>
      )}

      <div className={s.list}>
        {nested.map((item) => (
          <CommentItem
            key={item.pid}
            userInfo={userInfo}
            item={item}
            onReply={
              isMobile
                ? () => {
                    if (onReply) onReply(item.pid);
                  }
                : undefined
            }
          />
        ))}

        {missing > 0 && (
          <p className={s.partial}>
            {missing === 1
              ? '1 more reply isn’t shown on this page.'
              : `${missing} more replies aren’t shown on this page.`}
          </p>
        )}
      </div>
    </div>
  );
};
