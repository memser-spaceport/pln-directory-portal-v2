'use client';

import React, { useState } from 'react';
import Image from 'next/image';

import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import type { HuskyAction } from '@/services/husky/hooks/useHuskyChat';

import s from './DirectoryResultCards.module.scss';

/** How many cards before "Show all". */
const VISIBLE = 4;

const TYPE_META: Record<string, { label: string; icon: string; round: boolean }> = {
  member: { label: 'Member', icon: '/icons/husky/husky-member.svg', round: true },
  'member-event-participation': { label: 'Member', icon: '/icons/husky/husky-member.svg', round: true },
  team: { label: 'Team', icon: '/icons/husky/husky-team.svg', round: false },
  project: { label: 'Project', icon: '/icons/husky/husky-project.svg', round: false },
  event: { label: 'Event', icon: '/icons/husky/husky-event.svg', round: false },
  'irl-event': { label: 'Event', icon: '/icons/husky/husky-event.svg', round: false },
};

interface Props {
  actions: HuskyAction[];
  onSelect?: () => void;
}

/**
 * What the answer found in the directory, as compact cards.
 *
 * Built on `actions`, not on `sql`. The mint "Results from the directory" box
 * this replaces reads `message.sql`, which is empty in every flow that exists:
 * the fold hardcodes `sql: []` while streaming, and a rehydrated thread maps
 * `chat.sqlData` — a field the backend's response contract, its persistence
 * call and its stored documents have never contained. `actions` is what the
 * stream actually carries.
 *
 * Known gap: `actions` is `{name, directoryLink, type}`, so there is no picture
 * and no per-item fact to put beside the type. The card shows the per-type
 * glyph the answer's own result cards already use, and the type alone on the
 * second line. Real pictures and a fact need the backend to widen `actions`.
 */
export const DirectoryResultCards = ({ actions, onSelect }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const { trackDirectoryResultsCardClicked } = useHuskyAnalytics();

  if (!actions.length) return null;

  const shown = expanded ? actions : actions.slice(0, VISIBLE);
  const hidden = actions.length - shown.length;

  return (
    <div className={s.root}>
      <div className={s.title}>Results from the directory</div>
      <ul className={s.grid}>
        {shown.map((action, index) => {
          const meta = TYPE_META[action.type?.toLowerCase()] ?? {
            label: action.type,
            icon: '/icons/husky/husky-member.svg',
            round: true,
          };
          return (
            <li key={`${action.directoryLink}-${index}`}>
              <a
                className={s.card}
                href={action.directoryLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  trackDirectoryResultsCardClicked(action);
                  onSelect?.();
                }}
              >
                <Image
                  className={meta.round ? s.pictureRound : s.picture}
                  src={meta.icon}
                  alt=""
                  width={32}
                  height={32}
                />
                <span className={s.text}>
                  <span className={s.name} title={action.name}>
                    {action.name}
                  </span>
                  <span className={s.meta}>{meta.label}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <button type="button" className={s.showAll} onClick={() => setExpanded(true)}>
          Show all ({actions.length})
        </button>
      )}
    </div>
  );
};
