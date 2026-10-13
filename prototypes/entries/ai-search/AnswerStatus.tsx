'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';

import type { DirectoryHit, ScopedAnswerMeta } from './mocks';
import s from './AnswerStatus.module.scss';

/**
 * What stands in the answer's slot until the first word arrives. Replaces
 * production's `HuskyAnswerLoader` (five grey shimmer bars under a blue
 * "Fetching your response… This may take a moment. Please verify sources"
 * box with a spinning bone).
 *
 * One line, not a skeleton: the AI mark and a label that says what is
 * happening right now, shimmering while it happens. That is the pattern the
 * search-style assistants share on Mobbin — Perplexity's "Thinking" over the
 * step it is on, Copilot's shimmering "Searching the web", Klarna's sparkle +
 * "Understanding your request", Plane's step list. None of them draw the
 * answer's outline before there is an answer, and none of them put a
 * disclaimer over the wait.
 *
 * The steps are read off the turn, so each one is true of this question: a
 * scoped question names what it reads ("Reading applications to …"), and
 * the count is the number of directory results the answer will show. They
 * replace one another in place — the step you are on is the only one worth
 * reading, and a growing list is a second thing to scan above the answer.
 *
 * Changing words are the progress; the shimmer is the alive signal; and past
 * the usual wait the line says so (lesson 19), so a held last step never
 * reads as a hang. `?slow-answer` on the URL holds the wait long enough to
 * see that state.
 *
 * The disclaimer went with the box: the answer carries its sources pill, and
 * that is where checking them happens.
 */

/**
 * The two loaders under review, switched from the page's demo bar: `text` is
 * the step line above; `build` says nothing and draws the answer instead
 * (see `BuildStatus`), with the step kept for screen readers only. A context
 * rather than a prop, because the panel is mounted from more than one host
 * (same reason as `viewer.ts`).
 */
export type AnswerStatusVariant = 'text' | 'build';
export const AnswerStatusVariantContext = createContext<AnswerStatusVariant>('text');

/** How long each step stands. The simulated wait is the steps end to end. */
const STEP_MS = 1300;
const STEP_COUNT = 4;
/** A usual wait: every step once. */
export const USUAL_THINKING_MS = STEP_MS * STEP_COUNT;
/** Past this, the line owns up to the wait instead of holding the last step. */
const OVERDUE_MS = USUAL_THINKING_MS + 2000;

/** One full run of each loader, for the looping specimens on the page. */
export function specimenCycleMs(variant: AnswerStatusVariant): number {
  return variant === 'build' ? BUILD_MS + 2500 : OVERDUE_MS + 2500;
}

const slow = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('slow-answer');

/**
 * The wordless build is paced against a real answer's wait — 10 to 15
 * seconds — so the outline is mostly drawn by the time a usual answer lands
 * and a long one still has something moving.
 */
const BUILD_MS = 12000;

/** How long the prototype's simulated wait lasts, per loader. */
export function thinkingMsFor(variant: AnswerStatusVariant): number {
  if (variant === 'build') return slow ? 20000 : 10000;
  return slow ? OVERDUE_MS + 5000 : USUAL_THINKING_MS;
}

const NOUNS: Record<DirectoryHit['type'], [string, string]> = {
  member: ['member', 'members'],
  team: ['team', 'teams'],
  project: ['project', 'projects'],
  event: ['event', 'events'],
};

/* What the answer will stand on: the directory results it shows, or — when
   the directory has none — the sources under it (Mistral's "30 Sources"). */
function foundLabel(hits: DirectoryHit[], sourceCount: number): string {
  const counts = new Map<DirectoryHit['type'], number>();
  hits.forEach((h) => counts.set(h.type, (counts.get(h.type) ?? 0) + 1));
  const parts = Array.from(counts, ([type, n]) => `${n} ${NOUNS[type][n === 1 ? 0 : 1]}`);
  if (parts.length === 0) return sourceCount > 0 ? `Reading ${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}` : 'Reading the directory';
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return `Found ${list}`;
}

function stepsFor(hits: DirectoryHit[], sourceCount: number, scoped?: ScopedAnswerMeta): string[] {
  return [
    'Understanding your question',
    scoped ? `Reading ${scoped.retrieved.charAt(0).toLowerCase()}${scoped.retrieved.slice(1)}` : 'Searching members, teams and projects',
    foundLabel(hits, sourceCount),
    'Writing the answer',
  ];
}

interface AnswerStatusProps {
  hits: DirectoryHit[];
  sourceCount: number;
  scoped?: ScopedAnswerMeta;
}

export function AnswerStatus({ hits, sourceCount, scoped }: AnswerStatusProps) {
  const variant = useContext(AnswerStatusVariantContext);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 200);
    return () => clearInterval(t);
  }, []);

  const steps = stepsFor(hits, sourceCount, scoped);
  const label =
    elapsed >= OVERDUE_MS
      ? 'Taking longer than usual — still writing'
      : steps[Math.min(Math.floor(elapsed / STEP_MS), steps.length - 1)];

  if (variant === 'build') return <BuildStatus hits={hits} elapsed={elapsed} label={label} />;

  return (
    <div className={s.root} role="status" aria-live="polite">
      <AiSearchIcon size={16} className={s.mark} />
      {/* Keyed so each new step fades in rather than swapping under the eye. */}
      <span key={label} className={s.label}>
        {label}
      </span>
    </div>
  );
}

/* The outline, in the finished card's order: the prose, then the directory
   results under it. Each part appears at its share of BUILD_MS. */
const LINES = [
  { at: 0.04, width: '100%' },
  { at: 0.14, width: '72%' },
  { at: 0.24, width: '94%' },
  { at: 0.34, width: '58%' },
  { at: 0.44, width: '30%' },
];
const HITS_AT = 0.56;
const HIT_STAGGER = 0.07;
const MAX_HIT_CARDS = 4;

interface BuildStatusProps {
  hits: DirectoryHit[];
  elapsed: number;
  label: string;
}

/**
 * The wordless loader. An icon alone reads as working for a second or two;
 * over the 10–15 seconds a real answer takes it reads as stuck, because
 * nothing about it changes. So this one changes the whole time, and what it
 * changes into is the answer:
 *
 * - **How far** — the answer's outline draws itself line by line, paced to a
 *   usual wait, and one placeholder card appears per directory result the
 *   answer will show, in the results grid's own columns (Gemini's Deep Research builds its report the same way).
 *   More drawn means closer; nothing needs to say so.
 * - **Still alive** — the card breathes a slow grey glow and every drawn
 *   line keeps shimmering, so once the outline is complete a long wait still
 *   moves (Shopify's and Copilot's glowing generation slots).
 *
 * It is the answer card's own box (radius, border, padding), so when the
 * first word arrives the outline is replaced in place rather than the page
 * jumping to a new shape.
 */
function BuildStatus({ hits, elapsed, label }: BuildStatusProps) {
  const t = elapsed / BUILD_MS;
  const cards = hits.slice(0, MAX_HIT_CARDS);

  return (
    <div className={s.build} role="status" aria-live="polite">
      <span className={s.srOnly}>{label}</span>
      <AiSearchIcon size={20} className={s.buildMark} />
      <div className={s.lines}>
        {LINES.filter((l) => t >= l.at).map((l, i) => (
          <span key={i} className={s.line} style={{ width: l.width }} />
        ))}
      </div>

      {cards.length > 0 && t >= HITS_AT && (
        <div className={s.hits}>
          {cards
            .filter((_, i) => t >= HITS_AT + i * HIT_STAGGER)
            .map((h, i) => (
              <span key={i} className={s.hit}>
                <span className={h.type === 'member' ? s.hitAvatar : s.hitLogo} />
                <span className={s.hitText}>
                  <span className={s.hitBar} />
                  <span className={s.hitBarShort} />
                </span>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
