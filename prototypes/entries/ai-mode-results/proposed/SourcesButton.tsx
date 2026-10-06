'use client';

import React from 'react';
import { Popover } from '@base-ui-components/react/popover';

import { ArrowUpRightIcon } from '@/components/icons';

// The current sources pill's chrome, reused as is (pill, popup, rows).
import as from '../../ai-search/AnswerSources.module.scss';
import type { SourceRef } from './entities';
import s from './SourcesButton.module.scss';

/**
 * "N sources" — kept from the current `AnswerSources` (it already follows
 * Perplexity / ChatGPT / Dropbox Dash: a stacked-mark pill in the actions row
 * over a list of title + origin). One change: rows are **numbered**, because
 * the prose now carries numbered citation pills and the number is how the two
 * are matched. The current file refused numbers because "the wire carries no
 * sentence-to-source mapping" — production's wire does (`sourceRefs`, and
 * `[n](url)` in the answer text), so the refusal no longer holds.
 *
 * Marks are the record's picture where there is one, else its initial.
 */
export function SourcesButton({ refs }: { refs: SourceRef[] }) {
  if (refs.length === 0) return null;

  const mark = (r: SourceRef, big = false) =>
    r.picture ? (
      <img className={big ? s.picBig : s.pic} src={r.picture} alt="" width={big ? 24 : 16} height={big ? 24 : 16} />
    ) : (
      <span className={as.mark} aria-hidden="true">
        {r.title.charAt(0)}
      </span>
    );

  return (
    <Popover.Root>
      <Popover.Trigger className={`${as.pill} ${s.pill}`}>
        <span className={as.stack} aria-hidden="true">
          {refs.slice(0, 3).map((r) => (
            <React.Fragment key={r.href}>{mark(r)}</React.Fragment>
          ))}
        </span>
        {refs.length} {refs.length === 1 ? 'source' : 'sources'}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={as.positioner} side="top" align="start" sideOffset={6}>
          <Popover.Popup className={as.popup}>
            <Popover.Title className={as.title}>Sources</Popover.Title>
            <ul className={as.list}>
              {refs.map((r) => {
                const external = !r.href.includes('directory.plnetwork.io');
                return (
                  <li key={r.href}>
                    <a
                      className={as.row}
                      href={r.href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noreferrer' : undefined}
                    >
                      <span className={s.num}>{r.index}</span>
                      {mark(r, true)}
                      <span className={as.text}>
                        <span className={as.rowTitle}>{r.title}</span>
                        <span className={as.origin}>{r.origin}</span>
                      </span>
                      <ArrowUpRightIcon className={as.out} aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
