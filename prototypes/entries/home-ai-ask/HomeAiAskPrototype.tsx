'use client';

/**
 * REUSE MAP — home-ai-ask (AI Search's field on Home)
 *
 * Stands on the real Home prototype rather than a copy of it: `newsfeed`'s
 * NewsfeedPrototype, with the field passed in through its `leadSlot` and the
 * mode switch through `reviewExtras` (the host pattern `guided-tour` uses).
 *
 * IMPORTED:
 *  - newsfeed: the whole Home page; newsfeed-v0's review-band switch classes
 *  - ai-search: buildAnswer / prompts (mocked answers), AnswerStatus (the
 *    wait), DirectoryResultsCards, the answer card + prose classes
 *  - ai-search-page: the destination — it reads `?q=` (and `answered=1`,
 *    `viewer=out`) and opens that question as a thread
 *  - production: Markdown, CloseIcon; the AI Search mark (prototypes/components)
 */

import React, { useState } from 'react';
import clsx from 'clsx';

import NewsfeedPrototype from '../newsfeed/NewsfeedPrototype';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';

import { HomeAsk, type AskMode } from './HomeAsk';

const MODES: { value: AskMode; label: string; note: string }[] = [
  {
    value: 'overview',
    label: 'Answers here',
    note: 'A short answer under the field; Continue in AI Search for follow-ups.',
  },
  { value: 'handoff', label: 'Opens AI Search', note: 'Enter opens the AI Search page, already answering.' },
];

export default function HomeAiAskPrototype() {
  const [mode, setMode] = useState<AskMode>('overview');
  const [signedIn, setSignedIn] = useState(true);

  const reviewExtras = (
    <div className={v0.switchBar}>
      <span className={v0.switchLabel}>Ask field</span>
      <div className={v0.switch} role="tablist" aria-label="How the Home field answers">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            role="tab"
            aria-selected={mode === m.value}
            className={clsx(v0.switchBtn, mode === m.value && v0.switchBtnActive)}
            onClick={() => setMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <span className={v0.switchNote}>{MODES.find((m) => m.value === mode)!.note}</span>
    </div>
  );

  return (
    <NewsfeedPrototype
      leadSlot={<HomeAsk mode={mode} signedIn={signedIn} />}
      reviewExtras={reviewExtras}
      onSignedInChange={setSignedIn}
    />
  );
}
