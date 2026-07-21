'use client';

// Team-only list of impact ratings — a prototype sibling of production BoostersSection,
// reusing its module scss read-only so the drawer reads exactly like production.

import { useState } from 'react';
import bs from '@/components/page/gantry/shared/BoostersSection.module.scss';
import type { ImpactLevel, ImpactRating } from '../mocks';
import { IMPACT_LABELS } from '../mocks';
import s from './ImpactVotersSection.module.scss';

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#dcfce7', text: '#15803d' },
  { bg: '#ede9fe', text: '#6d28d9' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#e0f2fe', text: '#0369a1' },
];

export function avatarColor(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const MAX_RATERS_VISIBLE = 3;

function LockIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
      <rect x="1.5" y="5.5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3.5 5.5V3.5a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="5.5" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

interface Props {
  readonly ratings: ImpactRating[];
  readonly viewerRating: { level: ImpactLevel; note: string | null } | null;
}

export function ImpactVotersSection({ ratings, viewerRating }: Props) {
  const [showAll, setShowAll] = useState(false);

  const rows: { key: string; name: string; level: ImpactLevel; note: string | null }[] = [
    ...(viewerRating ? [{ key: 'you', name: 'You', level: viewerRating.level, note: viewerRating.note }] : []),
    ...ratings.map((r) => ({ key: r.uid, name: r.member.name, level: r.level, note: r.note })),
  ];
  if (rows.length === 0) return null;

  const visible = showAll ? rows : rows.slice(0, MAX_RATERS_VISIBLE);
  const hasMore = rows.length > MAX_RATERS_VISIBLE;

  return (
    <div className={bs.boostersSection}>
      <div className={bs.boostersHeader}>
        <LockIcon />
        <span>
          {rows.length} IMPACT {rows.length === 1 ? 'RATING' : 'RATINGS'} · TEAM-ONLY
        </span>
      </div>
      {visible.map((row) => {
        const c = avatarColor(row.name);
        return (
          <div key={row.key} className={bs.boosterRow}>
            <span className={bs.boosterAvatar} style={{ background: c.bg, color: c.text }}>
              {initials(row.name)}
            </span>
            <div className={bs.boosterInfo}>
              <span className={bs.boosterName}>
                {row.name}
                <span className={s.voteLevel}> · {IMPACT_LABELS[row.level]}</span>
              </span>
              {row.note ? (
                <span className={bs.boosterNote}>{row.note}</span>
              ) : (
                <span className={bs.boosterNoNote}>No note</span>
              )}
            </div>
          </div>
        );
      })}
      {hasMore && (
        <button
          type="button"
          className={bs.showAllBoosters}
          onClick={(e) => {
            e.stopPropagation();
            setShowAll((v) => !v);
          }}
        >
          {showAll ? 'Show less' : `Show all ${rows.length} ratings & notes`}
        </button>
      )}
    </div>
  );
}
