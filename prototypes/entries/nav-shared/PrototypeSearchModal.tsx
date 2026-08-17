'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

import { Modal } from '@/components/common/Modal';
import { CloseIcon } from '@/components/icons';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import { FullSearchResults } from '@/components/core/application-search/components/FullSearchResults';
import { RecentSearch } from '@/components/core/application-search/components/RecentSearch';
import type { SearchResult } from '@/services/search/types';

import s from './PrototypeSearchModal.module.scss';

const INPUT_ID = 'prototype-search-input';

interface PrototypeSearchModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The header search icon, opened.
 *
 * Production reaches this shape too, but only as a second step: `AppSearchDesktop`
 * puts an inline field in the header row with a dropdown under it, and promotes
 * itself to a full overlay (`.modal`, a dimmed backdrop) once you press Enter.
 * This makes the overlay the *first* state — press the icon, get the dialog —
 * which is what the icon already looks like it does.
 *
 * Everything inside is the real search: `DebouncedInput` and `FullSearchResults`
 * verbatim, and `FullSearchResults` runs `useFullApplicationSearch` itself
 * against `/v1/global-search/all`. Nothing here is mocked.
 *
 * Deliberately simplified: production's overlay is a two-column grid with
 * `AiChatPanel` on the right, which needs a real authToken + userInfo. Dropped —
 * this is one column, about the search field, and the AI half is a separate
 * question. `RecentSearch` carries the idle state (it renders null when there is
 * nothing to show), so the modal never opens onto an empty results frame.
 */
export function PrototypeSearchModal({ open, onClose }: PrototypeSearchModalProps) {
  const [term, setTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof SearchResult | null>(null);

  /* Open with the caret in the field — a search dialog you have to click into is
     a search dialog that cost you a click. rAF because the portal's children
     mount inside framer-motion's enter, so the node isn't focusable on the tick
     the flag flips. */
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => document.getElementById(INPUT_ID)?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  /* Reopening starts clean, the way production's `handleFullSearchClose` does —
     a dialog that reopens holding the last query is answering a question nobody
     asked twice. */
  const handleClose = () => {
    setTerm('');
    setActiveCategory(null);
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={handleClose} overlayClassname={s.overlay} className={s.container} lockScroll>
      <div className={s.card} role="dialog" aria-modal="true" aria-label="Search">
        <div className={s.header}>
          <div className={s.field}>
            <DebouncedInput
              ids={{ root: `${INPUT_ID}-root`, input: INPUT_ID }}
              value={term}
              onChange={setTerm}
              placeholder="Search"
              flushIcon={<Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />}
            />
          </div>
          <button type="button" className={s.close} onClick={handleClose} aria-label="Close search">
            <CloseIcon />
          </button>
        </div>

        <div className={s.body}>
          {term ? (
            <FullSearchResults
              searchTerm={term}
              onTryAiSearch={() => {}}
              onClose={handleClose}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          ) : (
            <div className={s.idle}>
              <RecentSearch onSelect={setTerm} />
              <p className={s.hint}>Search members, teams, projects, events and forum posts.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
