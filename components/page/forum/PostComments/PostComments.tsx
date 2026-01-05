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
      </div>
    </div>
  );
};
