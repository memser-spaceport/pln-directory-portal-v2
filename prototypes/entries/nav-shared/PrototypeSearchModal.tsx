'use client';

import { useCallback, useRef, useState } from 'react';

import { AppSearchDialog, type DialogView } from '@/components/core/application-search/components/AppSearchDialog';
import { useDebouncedValue } from '@/components/core/application-search/hooks/useDebouncedValue';
import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';
import { useHuskyChat } from '@/services/husky/hooks/useHuskyChat';

interface PrototypeSearchModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The header search icon, opened — now production's own dialog.
 *
 * This used to be a hand-built one-column dialog around `FullSearchResults`,
 * proposing exactly the shape production has since adopted (LAB-2477). Rather
 * than keep a second implementation of a dialog that now exists for real, the
 * prototype nav renders `AppSearchDialog` and only supplies the state the host
 * normally owns. Nothing here is mocked; the search runs against
 * `/v1/global-search/all` as it always did.
 *
 * The chat engine is mounted here rather than in a navbar, since a prototype
 * page has none. It runs signed-out, which is a real mode — 10 questions a day
 * against the same endpoint.
 */
export function PrototypeSearchModal({ open, onClose }: PrototypeSearchModalProps) {
  const [rawTerm, setRawTerm] = useState('');
  const term = useDebouncedValue(rawTerm, 700);
  const [view, setView] = useState<DialogView>('search');
  const [origin, setOrigin] = useState<'results' | 'history' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fullBleed = useIsBelowTabletLandscape();
  const chat = useHuskyChat({ isLoggedIn: false });

  /* Reopening starts clean — a dialog that reopens holding the last query is
     answering a question nobody asked twice. */
  const handleClose = useCallback(() => {
    setRawTerm('');
    setView('search');
    setOrigin(null);
    onClose();
  }, [onClose]);

  return (
    <AppSearchDialog
      isOpen={open}
      onClose={handleClose}
      fullBleed={fullBleed}
      rawTerm={rawTerm}
      onRawTermChange={setRawTerm}
      term={term}
      view={view}
      onViewChange={setView}
      origin={origin}
      onAskAi={(question) => {
        setOrigin(rawTerm.trim() ? 'results' : null);
        setView('answer');
        chat.startThread(question);
      }}
      inputRef={inputRef}
      isLoggedIn={false}
      onOpenThread={async () => false}
      chat={chat}
    />
  );
}
