'use client';

import type { ICommunityKudos } from './data/kudos-board.types';

/* ==========================================================================
   KudosCard (Lite)
   Renders one community kudos on the shared board. Every community kudos is
   awarded immediately, so the footer is a simple "Awarded" chip.

   Names and messages render through React's default text escaping (no
   dangerouslySetInnerHTML), satisfying the PRD's safe-rendering requirement.
   ========================================================================== */

interface IKudosCardProps {
  kudos: ICommunityKudos;
}

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6',
  '#3B82F6', '#EF4444', '#22C55E', '#F97316',
];

function avatarColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function initials(name: string): string {
  return name.split(' ').map((n) => n[0] ?? '').join('').toUpperCase().slice(0, 2);
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  const diffHr = Math.round(diffMs / 3_600_000);
  const diffDay = Math.round(diffMs / 86_400_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(iso).toLocaleDateString();
}

export function KudosCard({ kudos }: IKudosCardProps) {
  return (
    <article className="card">
      <div className="card__top">
        <span className="card__points">+{kudos.points} pts</span>
        <span className="card__time">{formatRelativeTime(kudos.createdAt)}</span>
      </div>

      <div className="card__header">
        <div className="card__avatar" style={{ background: avatarColor(kudos.giver.name) }} aria-hidden>
          {initials(kudos.giver.name)}
        </div>
        <div className="card__header-text">
          <div className="card__giver">{kudos.giver.name}</div>
          <div className="card__recipient">
            gave kudos to <span className="card__mention">@{kudos.recipient.name}</span>
          </div>
        </div>
      </div>

      <p className="card__message">&ldquo;{kudos.message}&rdquo;</p>

      <div className="card__meta">
        <span className="card__awarded"><span className="card__awarded-dot" />Awarded</span>
      </div>

      <style jsx>{`
        .card {
          background: white; border: 1px solid #E2E8F0;
          border-radius: 8px; padding: 18px 20px;
          display: flex; flex-direction: column; gap: 12px;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .card:hover { box-shadow: 0 4px 20px rgba(27,84,255,0.08); border-color: #87A6FD; }
        .card__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .card__points {
          display: inline-flex; align-items: center; gap: 4px;
          background: #DFE6FB; color: #1036A8; border: 1px solid #87A6FD;
          padding: 3px 9px; border-radius: 999px;
          font-size: 11.5px; font-weight: 700; font-variant-numeric: tabular-nums;
        }
        .card__time { font-size: 11.5px; color: #94A3B8; }
        .card__header { display: flex; align-items: flex-start; gap: 10px; }
        .card__avatar {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .card__header-text { flex: 1; min-width: 0; }
        .card__giver { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; }
        .card__recipient { font-size: 13px; color: #64748B; margin-top: 2px; }
        .card__mention { color: #1B54FF; font-weight: 600; }
        .card__message {
          font-size: 14px; color: #334155; line-height: 1.6;
          background: #FBFCFE; border-radius: 6px;
          padding: 11px 13px; border-left: 3px solid #1B54FF;
        }
        .card__meta { display: flex; align-items: center; gap: 8px; }
        .card__awarded {
          display: inline-flex; align-items: center; gap: 5px;
          background: #F0FDF4; color: #16A34A; border: 1px solid #DCFCE7;
          padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;
        }
        .card__awarded-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
      `}</style>
    </article>
  );
}

export default KudosCard;
