'use client';

import { useState } from 'react';
import type { WarmPathNoteRecent } from '@/services/investors/warm-intros-v2.types';
import f from './PathFeedback.module.scss';

const PREVIEW_MAX = 120;

interface Props {
  notes: WarmPathNoteRecent[];
}

/** Other people's notes on a path — Investor DB editors only. */
export function PathNotesAdminSummary({ notes }: Props) {
  const [open, setOpen] = useState(false);
  if (notes.length === 0) return null;

  return (
    <div className={f.adminSummary}>
      <button type="button" className={f.adminSummaryToggle} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {notes.length} {notes.length === 1 ? 'note' : 'notes'}
        <span className={f.adminSummaryCaret} aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open ? (
        <ul className={f.adminRecent}>
          {notes.map((row, i) => {
            const text = row.note.trim();
            return (
              <li key={`${row.actorEmail ?? 'anon'}-${row.updatedAt}-${i}`} className={f.adminRecentItem}>
                <span className={f.adminRecentWho}>{row.actorEmail || 'Unknown'}</span>
                <span className={f.adminRecentMeta}>
                  {text.slice(0, PREVIEW_MAX)}
                  {text.length > PREVIEW_MAX ? '…' : ''}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
