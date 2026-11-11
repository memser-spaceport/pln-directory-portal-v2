'use client';

import { getInitials } from '../leaderboard/leaderboard.mapper';
import type { FeedbackAuthor } from '@/services/plaa/feedback/feedback.types';

export const AVATAR_COLORS = ['#F2792B', '#8B5CF6', '#13A89E', '#048746', '#365A83', '#D6418B'];

function colorFor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i += 1) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function MemberDisplay({
  author,
  size = 'md',
  badge,
}: {
  author: FeedbackAuthor;
  size?: 'sm' | 'md';
  badge?: string;
}) {
  const dimension = size === 'sm' ? 24 : 32;

  return (
    <span className="fb-member">
      <span
        className="fb-member__avatar"
        style={{ background: colorFor(author.member_uid), width: dimension, height: dimension }}
        aria-hidden="true"
      >
        {getInitials(author.display_name)}
      </span>
      <span className="fb-member__name">{author.display_name}</span>
      {badge && <span className="fb-member__badge">{badge}</span>}

      <style jsx>{`
        .fb-member {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .fb-member__avatar {
          border-radius: 999px;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          flex: none;
        }
        .fb-member__name {
          font-size: 13px;
          font-weight: 600;
          color: var(--fb-ink, #0f172a);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .fb-member__badge {
          flex: none;
          padding: 2px 8px;
          border-radius: 999px;
          background: #eef2ff;
          color: #1b4cfe;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </span>
  );
}
