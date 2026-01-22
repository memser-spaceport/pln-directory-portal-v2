import { EyeIcon, ThumbsUpIcon, CommentIcon } from '@/components/icons';
import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { SingleStat } from './components/SingleStat';

import s from './ForumStats.module.scss';

interface Props {
  timestamp: number | string;
  views?: number;
  likes?: number;
  comments?: number;
  replies?: number;
}

export function ForumStats(props: Props) {
  const { timestamp, views, likes, comments, replies } = props;

  const timeAgo = formatTimeAgo(timestamp);

  return (
    <div className={s.root}>
      <span className={s.time}>{timeAgo}</span>

      <SingleStat icon={<EyeIcon />} value={views} label="Views" />
      <SingleStat icon={<ThumbsUpIcon />} value={likes} label="Likes" />
      <SingleStat icon={<CommentIcon />} value={comments} label="Comments" />
      <SingleStat icon={<CommentIcon />} value={replies} label="Replies" />
    </div>
  );
}
