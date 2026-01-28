import compact from 'lodash/compact';

import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { PushNotification } from '@/types/push-notifications.types';
import { CommentIcon, EyeIcon, ThumbsUpOutlinedIcon } from '@/components/icons';

import { Detail } from '../types';

export function getFooterDetails(notification: PushNotification) {
  const { category, createdAt, metadata } = notification;
  const timestamp = formatTimeAgo(createdAt);

  const details: (Detail | null)[] = [
    {
      value: timestamp,
    },
  ];

  if (['FORUM_POST', 'FORUM_REPLY'].includes(category)) {
    const { viewCount, voteCount, postCount } = metadata || {};

    const views = metadata?.viewCount
      ? {
          icon: <EyeIcon width={18} height={18} />,
          value: viewCount,
          label: 'Views',
        }
      : null;

    const likes = metadata?.voteCount
      ? {
          icon: <ThumbsUpOutlinedIcon width={16} height={16} />,
          value: voteCount,
          label: 'Likes',
        }
      : null;

    const comments = metadata?.postCount
      ? {
          icon: <CommentIcon width={16} height={16} />,
          value: (postCount as number) - 1,
          label: 'Comments',
        }
      : null;

    details.push(views);
    details.push(likes);
    details.push(comments);
  }

  return compact(details);
}
