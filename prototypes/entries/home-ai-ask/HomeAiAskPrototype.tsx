'use client';

/**
 * REUSE MAP — home-ai-ask (AI Search's field on Home)
 *
 * Stands on the real Home prototype rather than a copy of it: `newsfeed`'s
 * NewsfeedPrototype, with the field passed in through its `leadSlot` and the
 * switches through `reviewExtras` (the host pattern `guided-tour` uses).
 *
 * IMPORTED:
 *  - newsfeed: the whole Home page; newsfeed-v0's review-band switch classes
 *  - ai-search: buildAnswer / prompts (mocked answers), the answer card class
 *  - ai-mode-results/proposed: the answer inside the card — ThinkingStatus,
 *    AnswerProse (mentions + citation pills), AnswerShapes, EntityList,
 *    SourcesButton
 *  - ai-mode-results: the destination — it reads `?q=` (and `answered=1`,
 *    `viewer=out`) and opens that question as a thread
 *  - ai-search-page: its Composer is the "Big field" version
 *  - production: Markdown, CloseIcon; the AI Search mark (prototypes/components)
 *  - ai-search SearchPopover (header search, `aiInField`) via useHeaderSearch
 */

import React, { useState } from 'react';
import clsx from 'clsx';

import NewsfeedPrototype from '../newsfeed/NewsfeedPrototype';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';

import { HomeAsk, type AskViewer, type FieldSize } from './HomeAsk';
import homeAsk from './HomeAsk.module.scss';
import { useHeaderSearch } from './useHeaderSearch';

const SIZES: { value: FieldSize; label: string; note: string }[] = [
  { value: 'composer', label: 'Big field', note: "The AI Search page's own field, two lines tall at rest." },
  { value: 'box', label: 'Search box', note: 'One line with the AI Search mark inside it.' },
];

function Switch<T extends string>({
  label,
  ariaLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  options: { value: T; label: string; note: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={v0.switchBar}>
      <span className={v0.switchLabel}>{label}</span>
      <div className={v0.switch} role="tablist" aria-label={ariaLabel}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={value === o.value}
            className={clsx(v0.switchBtn, value === o.value && v0.switchBtnActive)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className={v0.switchNote}>{options.find((o) => o.value === value)!.note}</span>
    </div>
  );
}

const VIEWERS: { value: AskViewer; label: string; note: string }[] = [
  {
    value: 'founder',
    label: 'Portfolio founder',
    note: 'LAB-2704: a request ("Help me get intros…") goes to the PL team instead of AI Search.',
  },
  { value: 'member', label: 'Member', note: 'AI Search only, as today.' },
];

export default function HomeAiAskPrototype() {
  const [viewer, setViewer] = useState<AskViewer>('founder');
  const [size, setSize] = useState<FieldSize>('composer');
  const [signedIn, setSignedIn] = useState(true);
  const navExtras = useHeaderSearch(signedIn);

  const reviewExtras = (
    <>
      {signedIn && (
        <Switch label="Viewer" ariaLabel="Who is asking" options={VIEWERS} value={viewer} onChange={setViewer} />
      )}
      <Switch label="Field" ariaLabel="Size of the Home field" options={SIZES} value={size} onChange={setSize} />
    </>
  );

  /* The field answers on Home (the overview); the host keeps one team and
     upcoming events without their switches. The field leads the page alone:
     no Quick Actions under it (2026-10-15). The header carries ai-mode's
     search and Job Board as its own item. */
  return (
    <NewsfeedPrototype
      hostSwitches={false}
      quickActions={false}
      navExtras={navExtras}
      leadSlot={<HomeAsk mode="overview" size={size} signedIn={signedIn} viewer={viewer} />}
      reviewExtras={reviewExtras}
      onSignedInChange={setSignedIn}
      newsTitleClassName={homeAsk.homeNewsTitle}
    />
  );
}
