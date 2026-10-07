'use client';

import { useState } from 'react';
import clsx from 'clsx';

import { OhBadge } from '@/components/core/OhBadge/OhBadge';
import { CaretRightIcon, ArrowUpRightIcon } from '@/components/icons';

import type { DirectoryHit } from '../../ai-search/mocks';
import { isAvailable, pictureOf, TYPE_LABEL } from './entities';
import s from './EntityList.module.scss';

/** Rows before "Show all" — production's DirectoryResultCards also shows 4. */
const SHOWN = 4;

/**
 * "Results from the directory" — the records an answer stands on.
 *
 * Maps to production's `DirectoryResultCards`
 * (components/core/application-search/components/DirectoryResultCards), which
 * the live AnswerView renders under the prose, and to the ai-search entry's
 * `DirectoryResultsCards` (the current drawing in AI mode).
 *
 * Before: a two-column grid of separately bordered cards under a brand-blue
 * gear-icon heading, every card an arrow, nothing to say which person can be
 * met. After: one quiet panel of rows (Perplexity's peers list, Reddit
 * Answers' "Generated from these posts"):
 *
 * - **One object, not four.** A 12px-radius panel with hairline dividers reads
 *   as "the set this answer found"; four boxes read as four ads. It also costs
 *   less height at 4 rows than the 2×2 grid did on a phone (one column of
 *   bordered cards there).
 * - **Scannable.** 32px picture (circle for people, rounded square for the
 *   rest), name 14/500, one 12px line "Type · fact". Same anatomy as before —
 *   the content was right, the chrome was loud.
 * - **The row's own action.** The whole row opens the record (production's
 *   only action today). Members with office hours carry production's
 *   `OhBadge` "Available to connect" — the one fact that changes what you do
 *   next. Internal records end in a chevron (stays in the directory), an
 *   event's external site in an out-arrow (opens a new tab).
 * - **Heading.** Production's words, 14/600 primary with the count in
 *   tertiary; no gear icon, no brand colour — a section label, not a link.
 *
 * Not here on purpose: "Request an intro" on member rows. The 2026-09-28
 * standup dropped it from AI-search rows (people want to see the profile
 * before asking for an intro). The proposed panel accepts `requestIntro` only
 * so its props match the current one, and passes nothing here. See
 * PROPOSAL.md → open questions.
 */
export function EntityList({ hits, title = 'Results from the directory' }: { hits: DirectoryHit[]; title?: string }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? hits : hits.slice(0, SHOWN);
  const more = hits.length - SHOWN;

  return (
    <section className={s.root} aria-label={title}>
      <h3 className={s.title}>
        {title}
        <span className={s.count}>{hits.length}</span>
      </h3>

      <ul className={s.panel}>
        {shown.map((hit) => {
          const external = /^https?:/i.test(hit.source);
          const available = isAvailable(hit);
          return (
            <li key={`${hit.type}-${hit.source}`}>
              <a
                className={s.row}
                href={hit.source}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
              >
                <img
                  className={clsx(s.picture, hit.type !== 'member' && s.logo)}
                  src={pictureOf(hit.type, hit.name, hit.avatar)}
                  alt=""
                  width={32}
                  height={32}
                />
                <span className={s.text}>
                  <span className={s.name} title={hit.name}>
                    {hit.name}
                  </span>
                  <span className={s.meta} title={hit.meta}>
                    {TYPE_LABEL[hit.type]}
                    {hit.meta ? ` · ${hit.meta}` : ''}
                  </span>
                  {/* Phones: under the meta line, so the role keeps the width. */}
                  {available && (
                    <span className={clsx(s.badge, s.badgeUnder)}>
                      <OhBadge variant="primary" />
                    </span>
                  )}
                </span>
                {available && (
                  <span className={clsx(s.badge, s.badgeBeside)}>
                    <OhBadge variant="primary" />
                  </span>
                )}
                {external ? (
                  <ArrowUpRightIcon className={s.go} width={16} height={16} aria-hidden="true" />
                ) : (
                  <CaretRightIcon className={s.go} width={16} height={16} aria-hidden="true" />
                )}
              </a>
            </li>
          );
        })}
        {more > 0 && (
          <li>
            <button type="button" className={s.more} onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Show less' : `Show all (${hits.length})`}
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}
