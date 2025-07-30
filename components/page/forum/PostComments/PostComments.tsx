import React, { Fragment, useCallback, useEffect, useRef } from 'react';

import { TopicResponse } from '@/services/forum/hooks/useForumPost';
import { Avatar } from '@base-ui-components/react/avatar';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { formatDistanceToNow } from 'date-fns';

import s from './PostComments.module.scss';
import { CommentsInputDesktop } from '@/components/page/forum/CommentsInputDesktop';
import { clsx } from 'clsx';
import { LikesButton } from '@/components/page/forum/LikesButton';
import { decodeHtml } from '@/utils/decode';
import { ItemMenu } from '@/components/page/forum/ItemMenu/ItemMenu';
import { useMedia } from 'react-use';
import { IUserInfo } from '@/types/shared.types';
import { useForumAnalytics } from '@/analytics/forum.analytics';

interface Props {
  tid: number;
  mainPid: number;
  comments: TopicResponse['posts'] | undefined;
  onReply?: (id: number) => void;
  userInfo: IUserInfo;
}

export const PostComments = ({ comments, tid, mainPid, onReply, userInfo }: Props) => {
  const [replyToPid, setReplyToPid] = React.useState<number | null>(null);
  const isMobile = useMedia('(max-width: 960px)', false);

  if (!comments) return null;

  const nested = nestComments(comments);
  const replyToItem = comments.find((item) => item.pid === replyToPid);

  return (
    <div className={s.root}>
      <div className={s.title}>Comments ({comments.length})</div>

      <div className={s.input}>
        <CommentsInputDesktop tid={tid} toPid={mainPid} onCancel={() => setReplyToPid(null)} />
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

const CommentItem = ({ item, isReply, onReply, userInfo }: { item: NestedComment; isReply?: boolean; onReply?: (pid: number) => void; userInfo: IUserInfo }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [replyToPid, setReplyToPid] = React.useState<number | null>(null);
  const [editPid, setEditPid] = React.useState<number | null>(null);
  const analytics = useForumAnalytics();

  const scrollIntoView = useCallback(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <>
      <div className={s.itemRoot} key={item.pid} ref={ref}>
        <div className={s.footer}>
          <Avatar.Root className={s.Avatar}>
            <Avatar.Image src={getDefaultAvatar(item.user.username)} width="32" height="32" className={s.Image} />
            <Avatar.Fallback className={s.Fallback}>A</Avatar.Fallback>
          </Avatar.Root>
          <div className={s.col}>
            <div className={s.inline}>
              <div className={s.name}>{item.user.displayname}</div>
              <div className={s.position}>· {item.user.teamRole && item.user.teamName ? `${item.user.teamRole} @${item.user.teamName}` : ''}</div>
              <div className={s.time}>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</div>
            </div>
            <div className={clsx(s.time, s.mob)}>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</div>
          </div>
          {userInfo.uid === item.user.memberUid && (
            <div className={s.menuWrapper}>
              <ItemMenu
                onEdit={() => {
                  analytics.onPostEditClicked({ tid: item.tid, pid: item.pid });
                  setEditPid(item.pid);
                }}
              />
            </div>
          )}
        </div>
        {editPid ? (
          <CommentsInputDesktop initialFocused tid={item.tid} toPid={editPid} onCancel={() => setEditPid(null)} isEdit initialContent={item.content} />
        ) : (
          <div
            className={s.postContent}
            dangerouslySetInnerHTML={{
              __html: decodeHtml(item.content),
            }}
          />
        )}
        <div className={s.sub}>
          <LikesButton tid={item.tid} pid={item.pid} likes={item.votes} isLiked={item.upvoted} />
          {!isReply && (
            <>
              <div className={s.subItem}>
                <CommentIcon /> {item.replies.length} Replies
              </div>
              <div className={s.subItem}>
                <button
                  className={s.replyBtn}
                  onClick={() => {
                    analytics.onPostCommentReplyClicked({ tid: item.tid, pid: item.pid });
                    if (onReply) {
                      onReply(item.pid);
                      scrollIntoView();
                    } else {
                      setReplyToPid(item.pid);
                    }
                  }}
                >
                  Reply
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {replyToPid && <CommentsInputDesktop isReply initialFocused tid={item.tid} toPid={replyToPid} onCancel={() => setReplyToPid(null)} />}
    </>
  );
};

const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 3H2.50002C2.2348 3 1.98045 3.10536 1.79291 3.29289C1.60537 3.48043 1.50002 3.73478 1.50002 4V14C1.49886 14.1907 1.55281 14.3777 1.65537 14.5384C1.75793 14.6992 1.90473 14.8269 2.07814 14.9062C2.21029 14.9678 2.35425 14.9998 2.50002 15C2.73477 14.9994 2.96174 14.9157 3.14064 14.7638C3.14362 14.7618 3.14635 14.7595 3.14877 14.7569L5.15627 13H13.5C13.7652 13 14.0196 12.8946 14.2071 12.7071C14.3947 12.5196 14.5 12.2652 14.5 12V4C14.5 3.73478 14.3947 3.48043 14.2071 3.29289C14.0196 3.10536 13.7652 3 13.5 3ZM13.5 12H5.15627C4.92078 11.9999 4.69281 12.0829 4.51252 12.2344L4.50502 12.2413L2.50002 14V4H13.5V12Z"
      fill="#8897AE"
    />
  </svg>
);

type Comment = TopicResponse['posts'][0];

type NestedComment = Comment & { replies: Comment[] };

function nestComments(items: TopicResponse['posts']): NestedComment[] {
  const map = new Map<number, any>();

  // Create a lookup map and add `replies` to each
  for (const item of items) {
    map.set(item.pid, { ...item, replies: [] });
  }

  const roots: any[] = [];

  for (const item of items) {
    const current = map.get(item.pid);
    if (item.parent?.pid && map.has(item.parent.pid)) {
      const parent = map.get(item.parent.pid);
      parent.replies.push(current);
    } else {
      roots.push(current);
    }
  }

  return roots;
}
