'use client';

import s from './GantryDraftChip.module.scss';

interface Props {
  readonly title: string;
  readonly onResume: () => void;
  readonly onDiscard: () => void;
}

export function GantryDraftChip({ title, onResume, onDiscard }: Props) {
  return (
    <div className={s.chip}>
      <button type="button" className={s.body} onClick={onResume} aria-label={`Resume draft: ${title}`}>
        <span className={s.draftPill}>Draft</span>
        <span className={s.title}>{title}</span>
      </button>
      <button
        type="button"
        className={s.closeBtn}
        onClick={onDiscard}
        aria-label="Discard draft"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
