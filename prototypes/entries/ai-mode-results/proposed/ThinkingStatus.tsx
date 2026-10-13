'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';

import { USUAL_THINKING_MS } from '../../ai-search/AnswerStatus';
import type { DirectoryHit, ScopedAnswerMeta } from '../../ai-search/mocks';
import s from './ThinkingStatus.module.scss';

const STEP_COUNT = 4;
const STEP_MS = USUAL_THINKING_MS / STEP_COUNT;
const OVERDUE_MS = USUAL_THINKING_MS + 2000;

const NOUNS: Record<DirectoryHit['type'], [string, string]> = {
  member: ['member', 'members'],
  team: ['team', 'teams'],
  project: ['project', 'projects'],
  event: ['event', 'events'],
};

/* Same step copy as the current `AnswerStatus` (read off the turn). */
function stepsFor(hits: DirectoryHit[], sourceCount: number, scoped?: ScopedAnswerMeta): string[] {
  const counts = new Map<DirectoryHit['type'], number>();
  hits.forEach((h) => counts.set(h.type, (counts.get(h.type) ?? 0) + 1));
  const parts = Array.from(counts, ([type, n]) => `${n} ${NOUNS[type][n === 1 ? 0 : 1]}`);
  const found =
    parts.length === 0
      ? sourceCount > 0
        ? `Reading ${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`
        : 'Reading the directory'
      : `Found ${parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`}`;
  return [
    'Understanding your question',
    scoped ? `Reading ${scoped.retrieved.charAt(0).toLowerCase()}${scoped.retrieved.slice(1)}` : 'Searching members, teams and projects',
    found,
    'Writing the answer',
  ];
}

/**
 * The wait before the first word. Maps to the current `AnswerStatus` (text
 * variant) and production's `HuskyAnswerLoader`.
 *
 * The current line is already the modern pattern (one shimmering step label,
 * in place — Perplexity, Copilot, Plane), so the anatomy stays. Two things
 * change, both from lesson 19 ("how far / still alive / usual wait"):
 *
 * - **How far.** Four short segments after the label fill as the steps pass.
 *   The swapping label alone says *what* is happening, never how much is
 *   left; a step counter is the one honest "how far" a status-only backend
 *   can give (each segment is a real step boundary, not a fake percentage).
 * - **Alive.** The AI mark sits in a soft brand disc with a slow orbiting
 *   arc, so even a step that holds for several seconds keeps moving. Past the
 *   usual wait every segment is filled and the label owns up to it.
 *
 * It sits where the answer will start (no card), at the answer's own left
 * edge, so the first streamed word replaces it without a jump.
 */
export function ThinkingStatus({
  hits,
  sourceCount,
  scoped,
}: {
  hits: DirectoryHit[];
  sourceCount: number;
  scoped?: ScopedAnswerMeta;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 200);
    return () => clearInterval(t);
  }, []);

  const steps = stepsFor(hits, sourceCount, scoped);
  const overdue = elapsed >= OVERDUE_MS;
  const step = Math.min(Math.floor(elapsed / STEP_MS), STEP_COUNT - 1);
  const label = overdue ? 'Taking longer than usual — still writing' : steps[step];

  return (
    <div className={s.root} role="status" aria-live="polite">
      <span className={s.orb} aria-hidden="true">
        <AiSearchIcon size={14} />
      </span>
      <span key={label} className={s.label}>
        {label}
      </span>
      <span className={s.meter} aria-hidden="true">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <span key={i} className={clsx(s.seg, (overdue || i < step) && s.segDone, !overdue && i === step && s.segNow)} />
        ))}
      </span>
    </div>
  );
}
