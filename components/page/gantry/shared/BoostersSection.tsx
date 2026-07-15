'use client';

import { useState } from 'react';
import { useGantryItemPins } from '@/services/gantry/hooks/useGantryItemPins';
import type { GantryItem, GantryPinner } from '@/services/gantry/types';
import { avatarColor, initials } from './gantryAvatars';
import s from './BoostersSection.module.scss';

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
  // Use inline pins from the list/detail response when available to avoid N+1 requests.
  // Fall back to the dedicated hook only when pins weren't embedded (e.g. older API responses).
  const inlinePins = item.pins;
  const { data: fetchedPins, isLoading } = useGantryItemPins(
    item.uid,
    !inlinePins && item.pinCount > 0,
  );
  const pinners: GantryPinner[] = inlinePins ?? fetchedPins ?? [];
  if (!inlinePins && isLoading) return <div className={s.boostersLoading}>Loading boosters…</div>;
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
