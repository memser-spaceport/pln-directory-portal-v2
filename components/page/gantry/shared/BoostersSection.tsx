'use client';

import { useState } from 'react';
import { useGantryItemPins } from '@/services/gantry/hooks/useGantryItemPins';
import type { GantryItem } from '@/services/gantry/types';
import s from './BoostersSection.module.scss';

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#dcfce7', text: '#15803d' },
  { bg: '#ede9fe', text: '#6d28d9' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#e0f2fe', text: '#0369a1' },
];

function avatarColor(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const MAX_PINNERS_VISIBLE = 3;

function LockIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
      <rect x="1.5" y="5.5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3.5 5.5V3.5a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="5.5" cy="9" r="1" fill="currentColor" />
    </svg>
  );
}

export function BoostersSection({ item }: { item: GantryItem }) {
  const [showAll, setShowAll] = useState(false);
  const { data: pinners = [], isLoading } = useGantryItemPins(item.uid, item.pinCount > 0);
  if (isLoading) return <div className={s.boostersLoading}>Loading boosters…</div>;
  if (pinners.length === 0) return null;
  const visible = showAll ? pinners : pinners.slice(0, MAX_PINNERS_VISIBLE);
  const hasMore = pinners.length > MAX_PINNERS_VISIBLE;
  return (
    <div className={s.boostersSection}>
      <div className={s.boostersHeader}>
        <LockIcon />
        <span>{item.pinCount} BOOSTED · TEAM-ONLY</span>
      </div>
      {visible.map((p) => {
        const c = avatarColor(p.member.name);
        return (
          <div key={p.uid} className={s.boosterRow}>
            <span className={s.boosterAvatar} style={{ background: c.bg, color: c.text }}>
              {initials(p.member.name)}
            </span>
            <div className={s.boosterInfo}>
              <span className={s.boosterName}>{p.member.name}</span>
              {p.note ? (
                <span className={s.boosterNote}>{p.note}</span>
              ) : (
                <span className={s.boosterNoNote}>No note</span>
              )}
            </div>
          </div>
        );
      })}
      {hasMore && (
        <button
          type="button"
          className={s.showAllBoosters}
          onClick={(e) => {
            e.stopPropagation();
            setShowAll((v) => !v);
          }}
        >
          {showAll ? 'Show less' : `Show all ${item.pinCount} boosters & notes`}
        </button>
      )}
    </div>
  );
}
