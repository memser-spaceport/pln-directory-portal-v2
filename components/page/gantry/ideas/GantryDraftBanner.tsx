'use client';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import s from './GantryDraftBanner.module.scss';

interface Props {
  readonly title: string;
  readonly savedAt: number;
  readonly onResume: () => void;
  readonly onDiscard: () => void;
}

export function GantryDraftBanner({ title, savedAt, onResume, onDiscard }: Props) {
  return (
    <div className={s.banner} role="status">
      <div className={s.left}>
        <span className={s.draftPill}>Draft</span>
        <div className={s.info}>
          <span className={s.title}>{title}</span>
          <span className={s.meta}>Edited {formatTimeAgo(savedAt)} · not published yet</span>
        </div>
      </div>
      <div className={s.actions}>
        <button type="button" className={s.resumeBtn} onClick={onResume}>
          Resume
        </button>
        <button type="button" className={s.discardBtn} onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}
