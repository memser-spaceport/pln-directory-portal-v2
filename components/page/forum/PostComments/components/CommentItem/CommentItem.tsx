'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import Linkify from 'react-linkify';
import { useMedia } from 'react-use';
import parse from 'html-react-parser';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@base-ui-components/react/avatar';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { CommentIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { CommentsInputDesktop } from '@/components/page/forum/CommentsInputDesktop';
import { LikesButton } from '@/components/page/forum/LikesButton';
import { ItemMenu } from '@/components/page/forum/ItemMenu/ItemMenu';
import { IUserInfo } from '@/types/shared.types';
import { useForumAnalytics } from '@/analytics/forum.analytics';
import { ADMIN_ROLE } from '@/utils/constants';
import { OhBadge } from '@/components/core/OhBadge/OhBadge';
import { processPostContent } from '@/components/page/forum/Post';

import { NestedComment } from '../../types';

import s from './CommentItem.module.scss';

const MAX_DEPTH = 2; // Support 3 levels: 0 (comment), 1 (reply), 2 (reply to reply)

interface Props {
  item: NestedComment;
  depth?: number;
  onReply?: (pid: number) => void;
  userInfo: IUserInfo;
}

export const CommentItem = (props: Props) => {
  const { item, depth = 0, onReply, userInfo } = props;
  const isReply = depth > 0;
  const canReply = depth < MAX_DEPTH;

  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [replyToPid, setReplyToPid] = useState<number | null>(null);
  const [editPid, setEditPid] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const isMobile = useMedia('(max-width: 960px)', false);
  const analytics = useForumAnalytics();
  const isAvailableToConnect =
    item.user?.officeHours &&
    (item.user?.ohStatus === 'OK' || item.user?.ohStatus === 'NOT_FOUND' || item.user?.ohStatus === null);

  const scrollIntoView = useCallback(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    const replyTo = searchParams.get('replyTo');

    if (replyTo && Number(replyTo) === item.pid) {
      scrollIntoView();

      if (!isMobile) {
        setReplyToPid(item.pid);
      } else {
        setReplyToPid(null);
      }
    }
  }, [isMobile, item.pid, onReply, scrollIntoView, searchParams]);

  return (
    <>
      <div className={clsx(s.itemRoot, { [s.reply]: isReply })} key={item.pid} ref={ref} data-pid={item.pid}>
        <div className={s.footer}>
          <Link href={`/members/${item.user.memberUid}`} onClick={(e) => e.stopPropagation()}>
            <Avatar.Root className={s.Avatar}>
              <Avatar.Image
                src={item.user?.picture || getDefaultAvatar(item.user?.username)}
                width="32"
                height="32"
                className={s.Image}
              />
              <Avatar.Fallback className={s.Fallback}>A</Avatar.Fallback>
            </Avatar.Root>
          </Link>
          <div className={s.col}>
            <div className={s.inline}>
              <Link href={`/members/${item.user.memberUid}`} className={s.name} onClick={(e) => e.stopPropagation()}>
                {item.user.displayname}
              </Link>
              <div className={s.position}>
                · {item.user.teamRole && item.user.teamName ? `${item.user.teamRole} @${item.user.teamName}` : ''}
              </div>
              <div className={s.time}>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</div>
            </div>
            {isAvailableToConnect && <OhBadge variant="tertiary" />}
            <div className={clsx(s.time, s.mob)}>
              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
            </div>
          </div>
          {(userInfo.uid === item.user.memberUid || userInfo.roles?.includes(ADMIN_ROLE)) && (
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
          <CommentsInputDesktop
            initialFocused
            itemUid={item.user.memberUid}
            tid={item.tid}
            toPid={editPid}
            onCancel={() => setEditPid(null)}
            isEdit
            initialContent={item.content}
            timestamp={item.timestamp}
          />
        ) : (
          <div className={s.postContent}>
            {(() => {
              // Process the post content to handle markdown images
              const { processedContent, imageUrls } = processPostContent(item.content);

              return (
                <Linkify
                  componentDecorator={(decoratedHref, decoratedText, key) => {
                    // Check if it's an email address
                    const isEmail = decoratedHref.startsWith('mailto:') || decoratedText.includes('@');

                    // Check if this URL is an image URL that should be excluded from linking
                    const isImageUrl = imageUrls.some(
                      (imageUrl) => decoratedHref.includes(imageUrl) || decoratedText.includes(imageUrl),
                    );

                    // If it's an image URL, return the text without making it a link
                    if (isImageUrl) {
                      return <span key={key}>{decoratedText}</span>;
                    }

                    return (
                      <a
                        href={isEmail ? `mailto:${decoratedText}` : decoratedHref}
                        key={key}
                        target={isEmail ? '_self' : '_blank'}
                        rel={isEmail ? undefined : 'noopener noreferrer'}
                        className={s.autoLink}
                        title={isEmail ? `Send email to ${decoratedText}` : `Open ${decoratedHref}`}
                      >
                        {decoratedText}
                      </a>
                    );
                  }}
                >
                  {parse(processedContent)}
                </Linkify>
              );
            })()}
          </div>
        )}
        <div className={s.sub}>
          <LikesButton
            tid={item.tid}
            pid={item.pid}
            likes={item.votes}
            isLiked={item.upvoted}
            timestamp={item.timestamp}
          />
          {canReply && (
            <>
              <div className={s.subItem}>
                <CommentIcon /> {item.replies.length} Replies
              </div>
              <div className={s.subItem}>
                <button
                  className={s.replyBtn}
                  onClick={() => {
                    analytics.onPostCommentReplyClicked({
                      tid: item.tid,
                      pid: item.pid,
                      timeSincePostCreation: Date.now() - item.timestamp,
                    });
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

      {replyToPid && (
        <CommentsInputDesktop
          isReply
          timestamp={item.timestamp}
          initialFocused
          tid={item.tid}
          toPid={replyToPid}
          onCancel={() => {
            setReplyToPid(null);
            const params = new URLSearchParams(searchParams.toString());
            params.delete('replyTo');
            router.replace(`?${params.toString()}`, { scroll: false });
          }}
        />
      )}

      {/* Render nested replies */}
      {item.replies.length > 0 && (
        <div className={s.repliesWrapper}>
          {item.replies.map((reply) => (
            <CommentItem key={reply.pid} item={reply} depth={depth + 1} userInfo={userInfo} />
          ))}
        </div>
      )}
    </>
  );
};
