import compact from 'lodash/compact';

import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { PushNotification } from '@/types/push-notifications.types';

export function getFooterDetails(notification: PushNotification) {
  const { category, createdAt, metadata } = notification;
  const timestamp = formatTimeAgo(createdAt);

  const details: (string | null)[] = [timestamp];

  if (['FORUM_POST', 'FORUM_REPLY'].includes(category)) {
    const views = metadata?.viewCount ? `${metadata.viewCount} Views` : null;
    const likes = metadata?.voteCount ? `${metadata.voteCount} Likes` : null;
    const comments = metadata?.postCount ? `${(metadata.postCount as number) - 1} Comments` : null;

    details.push(views);
    details.push(likes);
    details.push(comments);
  }

  return compact(details);
}
