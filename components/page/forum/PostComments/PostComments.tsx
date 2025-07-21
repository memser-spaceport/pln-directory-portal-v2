import React from 'react';

import { TopicResponse } from '@/services/forum/hooks/useForumPost';
import { Avatar } from '@base-ui-components/react/avatar';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { formatDistanceToNow } from 'date-fns';

import s from './PostComments.module.scss';

interface Props {
  comments: TopicResponse['posts'] | undefined;
}

export const PostComments = ({ comments }: Props) => {
  if (!comments) return null;

  return (
    <div className={s.root}>
      <div className={s.title}>Comments ({comments.length})</div>
      <div className={s.list}>
        {comments.map((item) => (
          <div className={s.itemRoot} key={item.pid}>
            <div className={s.footer}>
              <Avatar.Root className={s.Avatar}>
                <Avatar.Image src={getDefaultAvatar(item.user.username)} width="32" height="32" className={s.Image} />
                <Avatar.Fallback className={s.Fallback}>A</Avatar.Fallback>
              </Avatar.Root>
              <div className={s.col}>
                <div className={s.inline}>
                  <div className={s.name}>{item.user.username}</div>
                  <div className={s.position}>· Position here</div>
                </div>
                <div className={s.time}>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</div>
              </div>
            </div>

            <div
              className={s.postContent}
              dangerouslySetInnerHTML={{
                __html: item.content,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
