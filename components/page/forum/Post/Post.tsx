'use client';

import React, { useMemo } from 'react';

import s from './Post.module.scss';
import Link from 'next/link';
import { Avatar } from '@base-ui-components/react/avatar';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { CommentInput } from '@/components/page/forum/CommentInput';
import { useForumPost } from '@/services/forum/hooks/useForumPost';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { PostComments } from '@/components/page/forum/PostComments';
import PostPageLoader from '@/components/page/forum/Post/PostPageLoader';
import { BreadCrumb } from '@/components/core/bread-crumb';
import { LikesButton } from '@/components/page/forum/LikesButton';
import { decodeHtml } from '@/utils/decode';
import { ItemMenu } from '@/components/page/forum/ItemMenu/ItemMenu';
import { IUserInfo } from '@/types/shared.types';
import { ScrollToTopButton } from '@/components/page/forum/ScrollToTopButton';
import { BackButton } from '@/components/page/forum/BackButton';
import { useCommentNotificationEmailLinkEventCapture, useCommentNotificationEmailReplyEventCapture, useDigestEmailLinkEventCapture } from '@/components/page/forum/hooks';

export const Post = ({ userInfo }: { userInfo: IUserInfo }) => {
  const { categoryId, topicId } = useParams();
  const { data } = useForumPost(topicId as string);
  const [replyToPid, setReplyToPid] = React.useState<number | null>(null);
  const replyToItem = data?.posts?.slice(1).find((item) => item.pid === replyToPid);

  const post = useMemo(() => {
    if (!data) {
      return null;
    }

    return {
      pid: data.mainPid,
      category: data.category.name,
      tid: data.tid,
      title: data.title,
      desc: data.posts[0]?.content,
      image: data.posts[0]?.user?.picture,
      author: data.author.displayname,
      position: data.author.teamRole && data.author.teamName ? `${data.author.teamRole} @${data.author.teamName}` : '',
      time: formatDistanceToNow(new Date(data.timestamp), { addSuffix: true }),
      upvoted: data.posts[0]?.upvoted,
      meta: {
        views: data.viewcount,
        likes: data.posts[0]?.votes,
        comments: data.postcount - 1,
      },
      isEditable: data.posts[0].user.memberUid === userInfo.uid,
    };
  }, [data, userInfo.uid]);

  useDigestEmailLinkEventCapture();
  useCommentNotificationEmailLinkEventCapture();
  useCommentNotificationEmailReplyEventCapture();

  if (!post) {
    return (
      <div className={s.container}>
        <div className={s.breadcrumbs}>
          <BreadCrumb backLink={`/forum?cid=${categoryId}`} directoryName="Forum" pageName="Post" />
        </div>
        <PostPageLoader />
      </div>
    );
  }

  return (
    <div className={s.container}>
      <BackButton to={`/forum?cid=${categoryId}`} />
      <div className={s.root}>
        <Link href={`/forum?cid=${categoryId}`} className={s.back}>
          <ChevronLeftIcon /> Back to forum
        </Link>

        <div className={s.content}>
          <div className={s.topicBadge}>{post.category}</div>
          {post.isEditable && <ItemMenu />}
        </div>

        <h1 className={s.title}>{post.title}</h1>

        <div className={s.sub}>
          <div className={s.subItem}>
            <ViewIcon /> {post.meta.views} Views
          </div>
          <LikesButton tid={post.tid} pid={post?.pid} likes={post.meta.likes} isLiked={post.upvoted} />
          <div className={s.subItem}>
            <CommentIcon /> {post.meta.comments} Comments
          </div>
        </div>

        <div className={s.footer}>
          <Avatar.Root className={s.Avatar}>
            <Avatar.Image src={post.image || getDefaultAvatar(post.author)} width="40" height="40" className={s.Image} />
            <Avatar.Fallback className={s.Fallback}>{post.author?.substring(0, 1)}</Avatar.Fallback>
          </Avatar.Root>
          <div className={s.col}>
            <div className={s.inline}>
              <div className={s.name}>by {post.author}</div>
              <div className={s.position}>· {post.position}</div>
            </div>
            <div className={s.time}>{post.time}</div>
          </div>
        </div>

        <div
          className={s.postContent}
          dangerouslySetInnerHTML={{
            __html: decodeHtml(post.desc),
          }}
        />

        <div className={s.divider} />
        <CommentInput tid={post.tid} toPid={replyToPid ?? post.pid} replyToName={replyToItem?.user.displayname} onReset={() => setReplyToPid(null)} />
      </div>

      <div className={s.root}>
        <PostComments comments={data?.posts?.slice(1)} tid={post.tid} mainPid={post.pid} onReply={(pid) => setReplyToPid(pid)} userInfo={userInfo} />
      </div>

      <ScrollToTopButton />
    </div>
  );
};

const ChevronLeftIcon = () => (
  <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 14.5L5 8.5L11 2.5" stroke="#156FF7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ViewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15.4569 7.7975C15.435 7.74813 14.9056 6.57375 13.7287 5.39687C12.1606 3.82875 10.18 3 7.99999 3C5.81999 3 3.83937 3.82875 2.27124 5.39687C1.09437 6.57375 0.562494 7.75 0.543119 7.7975C0.51469 7.86144 0.5 7.93064 0.5 8.00062C0.5 8.0706 0.51469 8.1398 0.543119 8.20375C0.564994 8.25312 1.09437 9.42688 2.27124 10.6038C3.83937 12.1713 5.81999 13 7.99999 13C10.18 13 12.1606 12.1713 13.7287 10.6038C14.9056 9.42688 15.435 8.25312 15.4569 8.20375C15.4853 8.1398 15.5 8.0706 15.5 8.00062C15.5 7.93064 15.4853 7.86144 15.4569 7.7975ZM7.99999 12C6.07624 12 4.39562 11.3006 3.00437 9.92188C2.43352 9.35418 1.94786 8.70685 1.56249 8C1.94776 7.29309 2.43343 6.64574 3.00437 6.07812C4.39562 4.69938 6.07624 4 7.99999 4C9.92374 4 11.6044 4.69938 12.9956 6.07812C13.5676 6.6456 14.0543 7.29295 14.4406 8C13.99 8.84125 12.0269 12 7.99999 12ZM7.99999 5C7.40665 5 6.82663 5.17595 6.33328 5.50559C5.83994 5.83524 5.45542 6.30377 5.22836 6.85195C5.00129 7.40013 4.94188 8.00333 5.05764 8.58527C5.17339 9.16721 5.45912 9.70176 5.87867 10.1213C6.29823 10.5409 6.83278 10.8266 7.41472 10.9424C7.99667 11.0581 8.59987 10.9987 9.14804 10.7716C9.69622 10.5446 10.1648 10.1601 10.4944 9.66671C10.824 9.17336 11 8.59334 11 8C10.9992 7.2046 10.6828 6.44202 10.1204 5.87959C9.55797 5.31716 8.79539 5.00083 7.99999 5ZM7.99999 10C7.60443 10 7.21775 9.8827 6.88885 9.66294C6.55996 9.44318 6.30361 9.13082 6.15224 8.76537C6.00086 8.39991 5.96125 7.99778 6.03842 7.60982C6.11559 7.22186 6.30608 6.86549 6.58578 6.58579C6.86549 6.30608 7.22185 6.1156 7.60981 6.03843C7.99778 5.96126 8.39991 6.00087 8.76536 6.15224C9.13081 6.30362 9.44317 6.55996 9.66293 6.88886C9.8827 7.21776 9.99999 7.60444 9.99999 8C9.99999 8.53043 9.78928 9.03914 9.41421 9.41421C9.03913 9.78929 8.53043 10 7.99999 10Z"
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
