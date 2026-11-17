'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import dealModal from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';

import { TAG_GROUPS, TOPICS } from '../digest-topics/mocks';
import dt from '../digest-topics/DigestTopicsPrototype.module.scss';
import fb from '../follow-shared/FollowButton.module.scss';

import s from './AllTopicsModal.module.scss';

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/**
 * All topics, opened from the digest page instead of leaving for News preferences (Polina,
 * 2026-11-17; Anuj had asked "new tab or modal"). The house standard modal (common `Modal` +
 * SubmitDealModal's chrome), holding News preferences' own tag picker: search, the 25 real
 * tags in its themed rows, its control chips. Picks are a draft until Save, so closing
 * throws them away. Mounted only while open, so each opening starts from what's saved.
 */
export function AllTopicsModal({
  subscribed,
  onClose,
  onSave,
}: {
  subscribed: string[];
  onClose: () => void;
  onSave: (topics: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(subscribed);
  const [query, setQuery] = useState('');
  const changed = draft.length !== subscribed.length || draft.some((t) => !subscribed.includes(t));
  const needle = query.trim().toLowerCase().replace(/^#/, '');
  const matches = needle ? TOPICS.filter((t) => t.includes(needle)) : TOPICS;
  const toggle = (t: string) => setDraft((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const chips = (list: string[], label: string) => (
    <div className={dt.chips} role="group" aria-label={label}>
      {list.map((t) => {
        const on = draft.includes(t);
        return (
          <button
            key={t}
            type="button"
            className={clsx(dt.chip, on && dt.chipOn)}
            aria-pressed={on}
            title={on ? `Unsubscribe from #${t}` : `Subscribe to #${t}`}
            onClick={() => toggle(t)}
          >
            {on ? <CheckIcon /> : <PlusIcon />}#{t}
          </button>
        );
      })}
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} ariaLabelledBy="all-topics-title" lockScroll inertBackground>
      <div className={clsx(dealModal.root, s.root)}>
        <div className={dealModal.header}>
          <div className={dealModal.headerText}>
            <h2 id="all-topics-title" className={dealModal.title}>
              Your topics{draft.length > 0 && ` · ${draft.length}`}
            </h2>
            <p className={dealModal.subtitle}>Ticked topics shape your digest and For You on Home.</p>
          </div>
          <button type="button" className={dealModal.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={clsx(dealModal.content, s.content)}>
          <SearchInput value={query} onChange={setQuery} placeholder="Search topics" className={s.search} />
          {matches.length === 0 ? (
            <p className={s.empty}>
              No topics match “{query.slice(0, 30)}”.{' '}
              <button type="button" className={dt.inlineLink} onClick={() => setQuery('')}>
                Show all topics
              </button>
            </p>
          ) : needle ? (
            chips(matches, 'Matching topics')
          ) : (
            // News preferences' themed rows: skim a group instead of reading 25 chips.
            // Fixed order: a chip never moves when it's ticked or unticked.
            <div className={dt.tagGroups}>
              {TAG_GROUPS.map((g) => (
                <div key={g.label} className={dt.tagGroup}>
                  <p className={dt.tagGroupLabel}>{g.label}</p>
                  {chips(g.tags, g.label)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={clsx(dealModal.footer, s.footer)}>
          <div className={dealModal.footerActions}>
            <Button size="s" style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button size="s" className={fb.glossy} disabled={!changed} onClick={() => onSave(draft)}>
              Save topics
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
