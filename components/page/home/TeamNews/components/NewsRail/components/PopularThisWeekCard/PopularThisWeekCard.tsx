'use client';

import { motion } from 'framer-motion';

import type { ITeamNewsPopularItem } from '@/types/team-news.types';

import s from '../../NewsRail.module.scss';

interface PopularThisWeekCardProps {
  items: ITeamNewsPopularItem[];
  onPopularItemClick: (item: ITeamNewsPopularItem, position: number) => void;
}

const CARD_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

// Tapping a story scrolls/reveals it in the main feed (see TeamNews.tsx's
// handlePopularItemClick) rather than opening its source link directly — that
// decision, and the analytics call, live entirely in the parent now; this is a
// pure prop-driven list. Whether to mount this component at all is decided by
// NewsRail, not here — a story can legitimately drop below the popularity
// threshold mid-session as upvotes change, so NewsRail's AnimatePresence needs
// to see that removal to play the exit (fade + height collapse) below, rather
// than the card just vanishing.
export function PopularThisWeekCard({ items, onPopularItemClick }: PopularThisWeekCardProps) {
  if (items.length === 0) return null;

  return (
    <motion.section
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={CARD_TRANSITION}
      className={s.railCard}
      aria-label="Popular this week"
    >
      <h3 className={s.railTitle}>Popular this week</h3>
      {items.map((item, position) => (
        <button
          key={item.uid}
          type="button"
          className={s.railStory}
          onClick={() => onPopularItemClick(item, position)}
        >
          <span className={s.railStoryTitle}>{item.title}</span>
          <span className={s.railReason}>
            ↑ {item.upvoteCount ?? 0} · {item.teamName}
          </span>
        </button>
      ))}
    </motion.section>
  );
}
