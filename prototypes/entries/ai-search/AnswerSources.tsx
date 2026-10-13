'use client';

import React from 'react';
import { Popover } from '@base-ui-components/react/popover';

import { ArrowUpRightIcon } from '@/components/icons';

import { CORPUS } from './mocks';
import s from './AnswerSources.module.scss';

const KIND_WORD: Record<string, string> = {
  members: 'Member',
  teams: 'Team',
  projects: 'Project',
  events: 'Event',
};

interface SourceView {
  href: string;
  title: string;
  /** The grey line under the title: where the page lives. */
  origin: string;
}

/**
 * The wire shape is `sources: string[]` — bare URLs, which is what production's
 * `HuskySourceCard` prints. A URL is an address, not a name, so the row is read
 * off it: a directory URL resolves to the record it points at ("Lumen Storage",
 * Team); anything else is named by its host. A real build would want the title
 * sent with the URL; until then nothing here claims more than the URL says.
 */
function describe(href: string): SourceView {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, '');
    const [index, uid] = url.pathname.split('/').filter(Boolean);
    const record = uid ? CORPUS.find((c) => c.uid === uid && c.index === index) : undefined;
    if (record) return { href, title: record.name, origin: `${KIND_WORD[record.index]} · ${host}` };
    return { href, title: host, origin: url.pathname.length > 1 ? `${host}${url.pathname}` : host };
  } catch {
    return { href, title: href, origin: '' };
  }
}

/**
 * An answer's sources: a quiet "N sources" pill at the end of the actions row,
 * opening a list of what was read.
 *
 * Replaces production's blue "2 source(s)" `InfoBox` above the prose and its
 * popover of raw URLs. Placement and anatomy are the settled ones — Perplexity,
 * ChatGPT and Dropbox Dash all end the answer with a stacked-mark "N sources"
 * pill beside the copy/thumbs row, and the list behind it is title over origin
 * with an external arrow (Customer.io's "5 references"). Sources are a receipt
 * for the answer, so they follow it rather than lead it, in the row's own grey.
 *
 * A pill and a list rather than chips at rest: two sources would fit as chips,
 * ten would not, and the count is the backend's.
 *
 * No numbers on the rows: a number promises a matching [1] in the prose, and
 * the wire carries no sentence-to-source mapping.
 */
export function AnswerSources({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;
  const views = sources.map(describe);

  return (
    <Popover.Root>
      <Popover.Trigger className={s.pill}>
        <span className={s.stack} aria-hidden="true">
          {views.slice(0, 3).map((v) => (
            <span key={v.href} className={s.mark}>
              {v.title.charAt(0)}
            </span>
          ))}
        </span>
        {views.length} {views.length === 1 ? 'source' : 'sources'}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={s.positioner} side="top" align="end" sideOffset={6}>
          <Popover.Popup className={s.popup}>
            <Popover.Title className={s.title}>Sources</Popover.Title>
            <ul className={s.list}>
              {views.map((v) => (
                <li key={v.href}>
                  <a className={s.row} href={v.href} target="_blank" rel="noreferrer">
                    <span className={s.mark} aria-hidden="true">
                      {v.title.charAt(0)}
                    </span>
                    <span className={s.text}>
                      <span className={s.rowTitle}>{v.title}</span>
                      {v.origin && <span className={s.origin}>{v.origin}</span>}
                    </span>
                    <ArrowUpRightIcon className={s.out} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
