import React, { Fragment } from 'react';

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

interface Props {
  tid: number;
  mainPid: number;
  comments: TopicResponse['posts'] | undefined;
  onReply?: (id: number) => void;
}

export const PostComments = ({ comments, tid, mainPid, onReply }: Props) => {
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
                    return <CommentItem key={reply.pid} item={reply as NestedComment} isReply />;
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

const CommentItem = ({ item, isReply, onReply }: { item: NestedComment; isReply?: boolean; onReply?: (pid: number) => void }) => {
  const [replyToPid, setReplyToPid] = React.useState<number | null>(null);
  const [editPid, setEditPid] = React.useState<number | null>(null);

  return (
    <>
      <div className={s.itemRoot} key={item.pid}>
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
          <div className={s.menuWrapper}>
            <ItemMenu onEdit={() => setEditPid(item.pid)} />
          </div>
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
                    if (onReply) {
                      onReply(item.pid);
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

const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15.4569 7.7975C15.435 7.74813 14.9056 6.57375 13.7287 5.39687C12.1606 3.82875 10.18 3 7.99999 3C5.81999 3 3.83937 3.82875 2.27124 5.39687C1.09437 6.57375 0.562494 7.75 0.543119 7.7975C0.51469 7.86144 0.5 7.93064 0.5 8.00062C0.5 8.0706 0.51469 8.1398 0.543119 8.20375C0.564994 8.25312 1.09437 9.42688 2.27124 10.6038C3.83937 12.1713 5.81999 13 7.99999 13C10.18 13 12.1606 12.1713 13.7287 10.6038C14.9056 9.42688 15.435 8.25312 15.4569 8.20375C15.4853 8.1398 15.5 8.0706 15.5 8.00062C15.5 7.93064 15.4853 7.86144 15.4569 7.7975ZM7.99999 12C6.07624 12 4.39562 11.3006 3.00437 9.92188C2.43352 9.35418 1.94786 8.70685 1.56249 8C1.94776 7.29309 2.43343 6.64574 3.00437 6.07812C4.39562 4.69938 6.07624 4 7.99999 4C9.92374 4 11.6044 4.69938 12.9956 6.07812C13.5676 6.6456 14.0543 7.29295 14.4406 8C13.99 8.84125 12.0269 12 7.99999 12ZM7.99999 5C7.40665 5 6.82663 5.17595 6.33328 5.50559C5.83994 5.83524 5.45542 6.30377 5.22836 6.85195C5.00129 7.40013 4.94188 8.00333 5.05764 8.58527C5.17339 9.16721 5.45912 9.70176 5.87867 10.1213C6.29823 10.5409 6.83278 10.8266 7.41472 10.9424C7.99667 11.0581 8.59987 10.9987 9.14804 10.7716C9.69622 10.5446 10.1648 10.1601 10.4944 9.66671C10.824 9.17336 11 8.59334 11 8C10.9992 7.2046 10.6828 6.44202 10.1204 5.87959C9.55797 5.31716 8.79539 5.00083 7.99999 5ZM7.99999 10C7.60443 10 7.21775 9.8827 6.88885 9.66294C6.55996 9.44318 6.30361 9.13082 6.15224 8.76537C6.00086 8.39991 5.96125 7.99778 6.03842 7.60982C6.11559 7.22186 6.30608 6.86549 6.58578 6.58579C6.86549 6.30608 7.22185 6.1156 7.60981 6.03843C7.99778 5.96126 8.39991 6.00087 8.76536 6.15224C9.13081 6.30362 9.44317 6.55996 9.66293 6.88886C9.8827 7.21776 9.99999 7.60444 9.99999 8C9.99999 8.53043 9.78928 9.03914 9.41421 9.41421C9.03913 9.78929 8.53043 10 7.99999 10Z"
      fill="#8897AE"
    />
  </svg>
);

const LikeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.625 5.0075C14.4842 4.84795 14.3111 4.72019 14.1171 4.63269C13.9231 4.54519 13.7128 4.49996 13.5 4.5H10V3.5C10 2.83696 9.73661 2.20107 9.26777 1.73223C8.79893 1.26339 8.16304 1 7.5 1C7.40711 0.999934 7.31604 1.02574 7.237 1.07454C7.15795 1.12333 7.09407 1.19318 7.0525 1.27625L4.69125 6H2C1.73478 6 1.48043 6.10536 1.29289 6.29289C1.10536 6.48043 1 6.73478 1 7V12.5C1 12.7652 1.10536 13.0196 1.29289 13.2071C1.48043 13.3946 1.73478 13.5 2 13.5H12.75C13.1154 13.5001 13.4684 13.3668 13.7425 13.1252C14.0166 12.8835 14.1931 12.5501 14.2388 12.1875L14.9888 6.1875C15.0153 5.97626 14.9966 5.76179 14.9339 5.55833C14.8712 5.35488 14.7659 5.16711 14.625 5.0075ZM2 7H4.5V12.5H2V7ZM13.9963 6.0625L13.2463 12.0625C13.231 12.1834 13.1722 12.2945 13.0808 12.3751C12.9895 12.4556 12.8718 12.5 12.75 12.5H5.5V6.61812L7.79437 2.02875C8.13443 2.09681 8.4404 2.2806 8.66021 2.54884C8.88002 2.81708 9.0001 3.1532 9 3.5V5C9 5.13261 9.05268 5.25979 9.14645 5.35355C9.24021 5.44732 9.36739 5.5 9.5 5.5H13.5C13.571 5.49998 13.6411 5.51505 13.7058 5.54423C13.7704 5.5734 13.8282 5.61601 13.8751 5.66922C13.9221 5.72242 13.9571 5.78501 13.978 5.85282C13.9989 5.92063 14.0051 5.9921 13.9963 6.0625Z"
      fill="#8897AE"
    />
  </svg>
);

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
