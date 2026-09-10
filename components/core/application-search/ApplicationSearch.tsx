'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';

import { IUserInfo } from '@/types/shared.types';
import {
  getServerShortcutLabel,
  getShortcutLabel,
  subscribeToNothing,
} from '@/components/core/application-search/shortcutLabel';
import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';
import { AppSearchDialog, type DialogView } from '@/components/core/application-search/components/AppSearchDialog';
import { useDebouncedValue } from '@/components/core/application-search/hooks/useDebouncedValue';
import { useHuskyChat } from '@/services/husky/hooks/useHuskyChat';
import { getAiSearchThread } from '@/services/husky/getAiSearchThread';
import { getUserCredentials } from '@/utils/auth.utils';

import s from './ApplicationSearch.module.scss';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

const SEARCH_DEBOUNCE_MS = 700;

/** True when the key event came from somewhere the user is already typing. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * The header search: one trigger per breakpoint, one dialog.
 *
 * This component is mounted in the root layout (`SiteHeader` → `nav-bar`), so
 * everything it owns outlives the dialog — which is the point. The open thread
 * survives close and reopen because the chat engine lives here rather than
 * inside the sheet that unmounts.
 *
 * **Exactly one dialog exists at any width.** The two surfaces used to be two
 * components hidden by media queries, which worked only because each one's
 * trigger *and* panel sat inside the same hidden root. `Modal` portals to
 * <body>, so a portalled dialog is outside every media query that governs its
 * surface — two mounted surfaces would render two dialogs, two `aria-modal`
 * containers and two live regions announcing the same answer. The triggers stay
 * CSS-driven (cheap, SSR-safe); the dialog is chosen at runtime, at the same
 * 960px the stylesheet uses.
 */
export const ApplicationSearch = ({ isLoggedIn, userInfo, authToken }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  /* The raw term is the single source of truth: the field, the AI row's label
     and anything submitted all read it, so none of them can lag behind what is
     on screen. Only the query reads the debounced value. */
  const [rawTerm, setRawTerm] = useState('');
  const term = useDebouncedValue(rawTerm, SEARCH_DEBOUNCE_MS);
  const [view, setView] = useState<DialogView>('search');
  /* Where the answer state was reached from, so Back and Escape have somewhere
     to go. `'restored'` is not a place the person navigated from — it is the
     reopened-with-a-thread case, and it is a value rather than a separate flag
     because `onBack` and the Escape ladder both already branch on this one
     field. A flag would have meant two edits that must stay in step. */
  const [origin, setOrigin] = useState<'results' | 'history' | 'restored' | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  /* Captured once, here, rather than in a per-dialog effect: `Modal` has no
     focus restore of its own, and a capture that runs inside the dialog would
     record whatever the dialog had just focused. */
  const openerRef = useRef<Element | null>(null);

  const fullBleed = useIsBelowTabletLandscape();

  /* Server snapshot and client value deliberately differ — see `./shortcutLabel`
     for why a lazy `useState` initializer is the wrong tool here. */
  const shortcutLabel = useSyncExternalStore(subscribeToNothing, getShortcutLabel, getServerShortcutLabel);

  /* Mounted here, once, and never inside the dialog: this component lives in
     the root layout, so the thread outlives the sheet — which is the only way
     "close it and come back" can work for a signed-out person, who has no
     history list to recover the conversation from. Mounting it twice would be
     worse than mounting it low: `useObject` keys its streamed object on a
     shared SWR key but keeps `isLoading` and its abort controller local, so two
     copies would half-share state. */
  const chat = useHuskyChat({ isLoggedIn });

  /* Mirrored into a ref, the way `useHuskyChat` mirrors its turns, so the two
     close paths can read the current view without either dep array gaining
     `view`. The back-gesture effect below pushes history in its body — adding a
     dependency there would push an entry on every view change. */
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  /* Whether the person was actually reading the conversation when the dialog
     went away. Backing out to search first is them saying they are done with
     it for now, and reopening has to honour that instead of dragging the
     thread back — "reopen where you left off" means where they left off, not
     wherever the last conversation happens to be. */
  const resumeThreadRef = useRef(false);

  const open = useCallback(() => {
    openerRef.current = document.activeElement;
    /* The signed-out quota cookie expires at midnight, so a session that
       outlives the day must not still be showing yesterday's exhausted state. */
    chat.refreshLimit();
    /* Reopen into the conversation, but only if that is where they were when
       it closed. `close()` already keeps the thread — it is only the route back
       to it that it throws away, by resetting the view. The decision is made
       here rather than by leaving `view` alone on close, because a preserved
       view would not survive a single keystroke: the dialog forces it back to
       'search' on every character typed. */
    if (resumeThreadRef.current && chat.turns.length > 0) {
      setView('answer');
      setOrigin('restored');
    }
    setIsOpen(true);
  }, [chat]);

  const closingRef = useRef(false);

  const close = useCallback(() => {
    /* Two taps 120ms apart on a laggy phone would otherwise pop two history
       entries and throw the person off the page entirely. */
    if (closingRef.current) return;
    closingRef.current = true;
    setTimeout(() => (closingRef.current = false), 0);

    /* Below the breakpoint the takeover owns a history entry, so closing it
       walks back rather than leaving a dead entry behind for the back gesture
       to land on. There is no API that says whether the previous entry is ours,
       hence the sentinel written when we pushed it. */
    if (typeof window !== 'undefined' && window.history.state?.__appSearchOpen) {
      window.history.back();
    }

    resumeThreadRef.current = viewRef.current === 'answer';

    setIsOpen(false);
    setRawTerm('');
    setView('search');
    setOrigin(null);
    /* The thread is deliberately not reset — it is what the person comes back
       to. Only the dialog's own position does. */
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener instanceof HTMLElement) opener.focus();
  }, []);

  /* A full-bleed takeover that the back gesture does not close is the one
     thing every Android user will try first. The URL is unchanged — only an
     entry is added — so the router has nothing to navigate to when it pops.
     NOTE: verify on a real device before merging; Next owns `history.state`,
     which is why this spreads it rather than replacing it. */
  useEffect(() => {
    if (!isOpen || !fullBleed) return;

    window.history.pushState({ ...window.history.state, __appSearchOpen: true }, '');
    /* This path deliberately does not go through `close()` — that would call
       `history.back()` again — so it has to record the same intent itself. */
    const onPopState = () => {
      resumeThreadRef.current = viewRef.current === 'answer';
      setIsOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isOpen, fullBleed]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (!isShortcut) return;

      /* Never steal the key from a field the user is already typing in —
         except the dialog's own, where re-focusing is the whole point. */
      if (e.target !== inputRef.current && isTypingTarget(e.target)) return;

      e.preventDefault();
      if (isOpen) {
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      open();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, open]);

  /* Reopen a past conversation in place, rather than sending the person to
     /husky/chat and costing them the search they were in the middle of.
     Returns false so the row that failed can say so and offer a retry, instead
     of transitioning to a blank answer the way the old handler did. */
  const handleOpenThread = useCallback(
    async (threadId: string): Promise<boolean> => {
      const { authToken } = await getUserCredentials(isLoggedIn);
      if (!authToken) return false;

      const result = await getAiSearchThread(threadId, authToken);
      if (!result.ok) return false;

      chat.hydrate(result.turns, result.threadId);
      setOrigin(view === 'history' ? 'history' : null);
      setView('answer');
      return true;
    },
    [chat, isLoggedIn, view],
  );

  /* Always a new conversation. A follow-up is what `ChatInput` inside the
     answer is for — the row and the suggested prompts are new questions, and
     with a session-lived engine an id reused "because turns exist" would file
     a fresh search as turn 2 of the last one. */
  const handleAskAi = useCallback(
    (question: string) => {
      setOrigin(rawTerm.trim() ? 'results' : null);
      setView('answer');
      chat.startThread(question);
    },
    [chat, rawTerm],
  );

  return (
    <>
      {/* One glyph, at every width, sitting with the header's other icon
          buttons. The inline field it replaces was a field you could not type
          into — it opened a dialog whose first row is the real one, so two
          fields appeared in sequence for one search. A real <button> rather
          than a div, because focus restore on close targets it and a div
          would drop focus to <body>. */}
      <button
        type="button"
        className={s.trigger}
        onClick={open}
        aria-label="Search"
        title={`Search (${shortcutLabel})`}
      >
        <Image src="/icons/search-right.svg" alt="" width={20} height={20} />
      </button>

      <AppSearchDialog
        isOpen={isOpen}
        onClose={close}
        fullBleed={fullBleed}
        rawTerm={rawTerm}
        onRawTermChange={setRawTerm}
        term={term}
        view={view}
        onViewChange={setView}
        origin={origin}
        onAskAi={handleAskAi}
        inputRef={inputRef}
        isLoggedIn={isLoggedIn}
        onOpenThread={handleOpenThread}
        shortcutLabel={shortcutLabel}
        chat={chat}
      />
    </>
  );
};
