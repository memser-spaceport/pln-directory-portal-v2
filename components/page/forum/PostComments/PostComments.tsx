import { useMedia } from 'react-use';
import React, { Fragment } from 'react';

import { TopicResponse } from '@/services/forum/hooks/useForumPost';
import { CommentsInputDesktop } from '@/components/page/forum/CommentsInputDesktop';
import { IUserInfo } from '@/types/shared.types';

import { NestedComment } from './types';
import { nestComments } from './utils/nestComments';
import { CommentItem } from './components/CommentItem';

import s from './PostComments.module.scss';

interface Props {
  tid: number;
  mainPid: number;
  comments: TopicResponse['posts'] | undefined;
  onReply?: (id: number) => void;
  userInfo: IUserInfo;
  timestamp: number;
}

export const PostComments = ({ comments, tid, mainPid, onReply, userInfo, timestamp }: Props) => {
  const isMobile = useMedia('(max-width: 960px)', false);

  if (!comments) return null;

  const nested = nestComments(comments);

  return (
    <div className={s.root}>
      <div className={s.title}>Comments ({comments.length})</div>

      <div className={s.input}>
        <CommentsInputDesktop tid={tid} toPid={mainPid} timestamp={timestamp} />
      </div>

      <div className={s.list}>
        {nested.map((item) => {
          return (
            <Fragment key={item.pid}>
              <CommentItem
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
              {item.replies.length > 0 && (
                <div className={s.repliesWrapper}>
                  {item.replies.map((reply) => {
                    return <CommentItem key={reply.pid} item={reply as NestedComment} isReply userInfo={userInfo} />;
                  })}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
