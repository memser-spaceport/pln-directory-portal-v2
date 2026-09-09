'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import { IUserInfo } from '@/types/shared.types';
import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';
import { AppSearchDialog, type DialogView } from '@/components/core/application-search/components/AppSearchDialog';
import { useDebouncedValue } from '@/components/core/application-search/hooks/useDebouncedValue';

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
  const [origin, setOrigin] = useState<'results' | 'history' | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  /* Captured once, here, rather than in a per-dialog effect: `Modal` has no
     focus restore of its own, and a capture that runs inside the dialog would
     record whatever the dialog had just focused. */
  const openerRef = useRef<Element | null>(null);

  const fullBleed = useIsBelowTabletLandscape();

  const open = useCallback(() => {
    openerRef.current = document.activeElement;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
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

  const handleAskAi = useCallback((question: string) => {
    // TODO(phase-b): startThread(question) against the hoisted chat engine.
    // Until then the answer state has nothing to render; the row and the
    // suggested prompts are wired but inert. Landing in the same PR.
    void question;
    setOrigin('results');
    setView('answer');
  }, []);

  return (
    <>
      {/* Field-shaped, but a real button: focus restore on close targets it, and
          a div would drop focus to <body> instead. */}
      <button type="button" className={s.desktopTrigger} onClick={open}>
        <Image src="/icons/search-right.svg" alt="" width={20} height={20} />
        <span className={s.desktopTriggerText}>Search</span>
        <kbd className={s.desktopTriggerKbd}>⌘K</kbd>
      </button>

      <button type="button" className={s.mobileTrigger} onClick={open} aria-label="Search">
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
      />
    </>
  );
};
