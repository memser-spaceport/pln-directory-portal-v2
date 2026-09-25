'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { FoundItem } from '@/services/search/types';

import { SEARCH_ANCHOR_SELECTOR, type PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { useAskIntro } from '../warm-intros-founders/useAskIntro';

import { SearchPopover, SEARCH_PLACEHOLDER } from './SearchPopover';
import { AiSearchView, type AiSearchRequest } from './AiSearchView';
import { buildCorpusScope } from './corpusScope';
import type { AiSearchScope } from './scope';
import type { AiSearchViewer } from './viewer';

type NavProps = Partial<React.ComponentProps<typeof PrototypeNavBar>>;

/**
 * Search in two sizes, for a page that isn't the `ai-search` entry.
 *
 * The same wiring `AiSearchPrototype` holds inline — the term, the two open
 * flags, the handoff in each direction, ⌘K, the founder's ask form — returned
 * as the navbar's props plus the layers to render beside the page. Written for
 * `guided-tour`, which stands on the homepage; `AiSearchPrototype` keeps its
 * own copy for now because it also drives the view from its demo bar.
 *
 * The host wraps its tree in `AiSearchViewerContext.Provider` with the same
 * `viewer`: the answer builder reads the seat from context, not from here.
 */
export function useAiSearchHost(viewer: AiSearchViewer) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [request, setRequest] = useState<AiSearchRequest | null>(null);
  const [scope, setScope] = useState<AiSearchScope | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAiOpen(false);
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const askAi = useCallback((q: string) => {
    setSearchOpen(false);
    setScope(null);
    setRequest({ question: q, origin: q ? 'results' : null, nonce: Date.now() });
    setAiOpen(true);
  }, []);

  const askAbout = useCallback((item: FoundItem) => {
    setSearchOpen(false);
    setScope(buildCorpusScope(item));
    setRequest({ question: '', origin: 'results', nonce: Date.now() });
    setAiOpen(true);
  }, []);

  const backToResults = useCallback(() => {
    setAiOpen(false);
    setScope(null);
    setSearchOpen(true);
  }, []);

  const closeAi = useCallback(() => setAiOpen(false), []);

  const anchor = useCallback(() => document.querySelector<HTMLElement>(SEARCH_ANCHOR_SELECTOR), []);
  const searchField = useMemo(() => ({ value: term, onChange: setTerm, placeholder: SEARCH_PLACEHOLDER }), [term]);

  const { askFor, ask: askIntro, asking, modal: askModal } = useAskIntro();
  const intro = useMemo(
    () => (viewer === 'founder' ? { askFor, onAsk: askIntro } : undefined),
    [viewer, askFor, askIntro],
  );

  const renderSearchModal = useCallback(
    (open: boolean, close: () => void) => (
      <SearchPopover
        open={open}
        onClose={close}
        term={term}
        onTermChange={setTerm}
        onAskAi={askAi}
        onAskAbout={askAbout}
        intro={intro}
        holdOpen={asking}
        anchor={anchor}
        fieldInHeader
      />
    ),
    [term, askAi, askAbout, anchor, intro, asking],
  );

  const navProps: NavProps = {
    searchable: true,
    searchOpen,
    onSearchOpenChange: setSearchOpen,
    renderSearchModal,
    searchField,
    onAiSearchClick: () => askAi(''),
  };

  const layers = (
    <>
      <AiSearchView open={aiOpen} onClose={closeAi} request={request} onBackToResults={backToResults} scope={scope} />
      {askModal}
    </>
  );

  return { navProps, layers, askAi, closeAi, aiOpen };
}
