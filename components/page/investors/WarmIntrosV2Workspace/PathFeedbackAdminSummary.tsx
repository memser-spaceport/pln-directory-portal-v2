'use client';

import { useState } from 'react';
import type { WarmPathFeedbackSummary } from '@/services/investors/warm-intros-v2.types';
import f from './PathFeedback.module.scss';

interface Props {
  summary: WarmPathFeedbackSummary;
}

/** Compact aggregated feedback for Investor DB editors under a path card strip. */
export function PathFeedbackAdminSummary({ summary }: Props) {
  const [open, setOpen] = useState(false);
  const parts: string[] = [];
  if (summary.yesCount > 0) parts.push(`${summary.yesCount} can refer`);
  if (summary.noCount > 0) parts.push(`${summary.noCount} can’t`);
  if (summary.noteCount > 0) parts.push(`${summary.noteCount} ${summary.noteCount === 1 ? 'note' : 'notes'}`);
  if (parts.length === 0) return null;

  return (
    <div className={f.adminSummary}>
      <button type="button" className={f.adminSummaryToggle} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {parts.join(' · ')}
        <span className={f.adminSummaryCaret} aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>
      {open && summary.recent.length > 0 ? (
        <ul className={f.adminRecent}>
          {summary.recent.map((row, i) => (
            <li key={`${row.actorEmail ?? 'anon'}-${row.updatedAt}-${i}`} className={f.adminRecentItem}>
              <span className={f.adminRecentWho}>{row.actorEmail || 'Unknown'}</span>
              <span className={f.adminRecentMeta}>
                {row.canRefer === 'yes' ? 'can refer' : row.canRefer === 'no' ? 'can’t refer' : 'note only'}
                {row.note?.trim()
                  ? ` — ${row.note.trim().slice(0, 120)}${row.note.trim().length > 120 ? '…' : ''}`
                  : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
