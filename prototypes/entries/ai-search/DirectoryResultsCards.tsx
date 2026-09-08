'use client';

import { useState } from 'react';
import clsx from 'clsx';

import { ArrowUpRightIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
// The 12px/500 brand text production uses for "Show all"-class toggles in the
// AI panel — the same class the idle state's history door wears.
import sub from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader/ChatSubheader.module.scss';

import type { DirectoryHit } from './mocks';
import s from './DirectoryResultsCards.module.scss';

/** How many cards show before "Show all" — two rows of the two-column grid. */
const SHOWN = 4;

const TYPE_LABEL: Record<DirectoryHit['type'], string> = {
  member: 'Member',
  team: 'Team',
  project: 'Project',
  event: 'Event',
};

/* Production's own "no picture yet" marks for the three non-person types, from
   the cards that draw them on their own pages. Members get production's seeded
   dicebear, which is what `MemberDetailHeader` renders for a member with no
   photo — a face-shaped fallback would invite the reader to judge whether it
   is right. */
const FALLBACK_LOGO: Record<Exclude<DirectoryHit['type'], 'member'>, string> = {
  team: '/icons/team-default-profile.svg',
  project: '/icons/project-default.svg',
  event: '/icons/irl-event-default-logo.svg',
};

/**
 * "Results from the directory" — the entities an answer is grounded in, as
 * compact cards under the prose.
 *
 * Copy-simplify of `components/page/husky/directory-results`, redrawn on
 * purpose. What production draws: a mint-tinted box (`#f5fafb`) holding cards
 * with a blue→teal gradient border, an 18px/600 name, and the type spelled out
 * under it, in three columns from a viewport query. In this 720px dialog that
 * became two columns of loud cards where "Filecoin Retrieval Net…" truncates at
 * headline size and the second line only repeats what the icon already says.
 * None of those colours are in the PL palette, and nothing else in the dialog
 * is drawn that way.
 *
 * The redraw follows how answer surfaces cite what they stand on (Perplexity
 * and ChatGPT sources rows, Customer.io's references list, Fireflies'
 * references): a quiet grid of small cards — 32px picture, 14px/500 name,
 * one 12px line of the fact the directory knows about it — the same row
 * grammar as every other list in this dialog, on the dialog's own borders and
 * hover. The type moves into that line ("Team · Berlin, Germany"), so it stops
 * being a label on its own and becomes the head of a sentence that also says
 * something. Members wear a circle and teams, projects and events a rounded
 * square: this is a mixed list where *what kind of thing* is part of what the
 * reader is choosing between, which is the case lesson 12's eighth example
 * reserves the split for.
 *
 * Section head: the same 14px/500 icon+label line as the sibling "Follow up
 * questions" head, in brand rather than production's gradient text. "Show all
 * (N)" keeps production's words and expands in place — a popup over a dialog
 * would be a modal on a modal.
 *
 * Internal destinations open in this tab, as the dialog's keyword results do;
 * only an event's external site opens in a new one. (Production opens all of
 * them in new tabs.)
 */
export function DirectoryResultsCards({ hits }: { hits: DirectoryHit[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? hits : hits.slice(0, SHOWN);
  const hasMore = hits.length > SHOWN;

  return (
    <section className={s.root} aria-label="Results from the directory">
      <div className={s.head}>
        <h3 className={s.title}>
          <img src="/icons/chip.svg" width={16} height={16} alt="" />
          Results from the directory
        </h3>
        {hasMore && (
          <button type="button" className={sub.button} onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Show less' : `Show all (${hits.length})`}
          </button>
        )}
      </div>

      <ul className={s.grid}>
        {shown.map((hit) => {
          const external = /^https?:/i.test(hit.source);
          const picture = hit.type === 'member' ? getDefaultAvatar(hit.name) : FALLBACK_LOGO[hit.type];
          return (
            <li key={`${hit.type}-${hit.source}`}>
              <a
                className={s.card}
                href={hit.source}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                aria-label={`${hit.name} — ${TYPE_LABEL[hit.type]}`}
              >
                <img
                  className={clsx(s.picture, hit.type !== 'member' && s.logo)}
                  src={picture}
                  alt=""
                  width={32}
                  height={32}
                />
                {/* Both lines clip at half the dialog's width; the `title`s hand
                    back what the ellipsis took (a long role, a long name). */}
                <span className={s.text}>
                  <span className={s.name} title={hit.name}>
                    {hit.name}
                  </span>
                  <span className={s.meta} title={hit.meta}>
                    {TYPE_LABEL[hit.type]}
                    {hit.meta ? ` · ${hit.meta}` : ''}
                  </span>
                </span>
                <ArrowUpRightIcon className={s.arrow} />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
