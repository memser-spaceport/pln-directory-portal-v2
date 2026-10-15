'use client';

import React, { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';

import type { FoundItem } from '@/services/search/types';

import { PrototypeNavBar, SEARCH_ANCHOR_SELECTOR } from '../nav-shared/PrototypeNavBar';
import { SearchPopover, SEARCH_PLACEHOLDER } from '../ai-search/SearchPopover';

const PAGE = '/prototypes/ai-mode-results';

/**
 * The header search as `ai-mode` has it (2026-10-15 review): you type in the
 * header field, which fills the free width in the row; results hang under it
 * with no "Chat with AI Search about…" band, because the field's AI badge is
 * the door and it carries what you typed. AI Search is the updated page
 * (ai-mode-results), the same destination Home's own field opens, so every AI
 * door on this page lands in one place.
 */
export function useHeaderSearch(signedIn: boolean): Partial<ComponentProps<typeof PrototypeNavBar>> {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const openAi = useCallback(
    (question: string) => {
      setSearchOpen(false);
      const params = new URLSearchParams();
      if (question.trim()) params.set('q', question.trim());
      if (!signedIn) params.set('viewer', 'out');
      const qs = params.toString();
      router.push(qs ? `${PAGE}?${qs}` : PAGE);
    },
    [router, signedIn],
  );

  const anchor = useCallback(() => document.querySelector<HTMLElement>(SEARCH_ANCHOR_SELECTOR), []);
  const searchField = useMemo(() => ({ value: term, onChange: setTerm, placeholder: SEARCH_PLACEHOLDER }), [term]);

  /* A row's Ask AI: the page has no scope chip by URL, so it opens on the
     record's first question instead. */
  const renderSearchModal = useCallback(
    (open: boolean, close: () => void) => (
      <SearchPopover
        open={open}
        onClose={close}
        term={term}
        onTermChange={setTerm}
        onAskAi={openAi}
        onAskAbout={(item: FoundItem) => openAi(`What does ${item.name} work on?`)}
        anchor={anchor}
        fieldInHeader
        aiInField
      />
    ),
    [term, openAi, anchor],
  );

  return {
    searchable: true,
    searchOpen,
    onSearchOpenChange: setSearchOpen,
    renderSearchModal,
    searchField,
    onAiSearchClick: () => openAi(term),
    jobsInBar: true,
  };
}
