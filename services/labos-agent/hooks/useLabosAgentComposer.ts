'use client';

import { type KeyboardEvent, type RefObject, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import type { LabosAgentMentionChip, LabosAgentPickerItem, LabosAgentTurn } from '@/types/labos-agent.types';

import { LABOS_AGENT_MAX_MENTIONS } from '../constants';
import { pickerGroups, readAtQuery, replaceAtQuery, toMentionChip } from '../labos-agent.mentions';
import { PAGE_NOT_FOUND_CODES } from './useLabosAgentChat';
import { useLabosAgentMentionSearch } from './useLabosAgentMentionSearch';

/** Sets a textarea value the way typing does, so the composer's own `onChange` (height, `@` check) runs. */
export function setNativeValue(el: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** The open picker. `at`: `@` in the composer, `start` is the index of the `@`. `plus`: the + button. */
export type LabosAgentPickerState = { mode: 'at' | 'plus'; query: string; start: number };

interface UseLabosAgentComposerOptions {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** Sends the message with its chips. False: nothing was sent (empty text, or a turn still works). */
  send: (text: string, chips: LabosAgentMentionChip[]) => boolean;
  /** The last turn of the chat, so a failed send puts its text and chips back once. */
  lastTurn?: LabosAgentTurn;
  onTextRestored: (turnId: string) => void;
  onMentionsRestored: (turnId: string) => void;
  /** False: `@` opens no picker and the message has no chips (LAB-3457: a chat scoped to one profile). */
  mentions?: boolean;
  /** The key of the page the agent reads, so the picker does not offer it again (panel only). */
  pageKey?: string | null;
  /** The label of the page under the panel while its chip is off: the picker offers it back (panel only). */
  currentPageLabel?: string | null;
  /** The member picked "the page under the panel" in the picker (panel only). */
  onRestorePage?: () => void;
}

/**
 * The agent's composer logic, shared by the panel and the AI agent chat page (LAB-3457: the same code, no copies).
 * S6 @mentions: the chips of the next message, the `@` and + picker with C4 search, the keyboard rules (S6-F9), and
 * the restore of a failed message (S5-C29 page 404, S6-F17 mention 404). The surface draws the chips and the field.
 */
export function useLabosAgentComposer({
  inputRef,
  send,
  lastTurn,
  onTextRestored,
  onMentionsRestored,
  mentions = true,
  pageKey = null,
  currentPageLabel = null,
  onRestorePage,
}: UseLabosAgentComposerOptions) {
  const [chips, setChips] = useState<LabosAgentMentionChip[]>([]);
  const [picker, setPicker] = useState<LabosAgentPickerState | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const pickerRef = useRef(picker);
  // True while code (not the member) sets the composer text, so `readMention` does not open the picker.
  const quietRef = useRef(false);
  // S6-F2: the start of an `@` that Esc closed. The picker opens again only for a new `@`.
  const closedAtRef = useRef<number | null>(null);
  const pickerId = useId();
  const listboxId = `${pickerId}-listbox`;
  useEffect(() => {
    pickerRef.current = picker;
  }, [picker]);

  /*
   * Code sets the composer text through an `input` event, so the field sees it (S6-F19: the "Shift + Enter" hint
   * shows only with text).
   */
  const setComposerText = useCallback((el: HTMLTextAreaElement, value: string) => {
    quietRef.current = true;
    try {
      setNativeValue(el, value);
    } finally {
      quietRef.current = false;
    }
  }, []);

  const limitReached = chips.length >= LABOS_AGENT_MAX_MENTIONS;
  const search = useLabosAgentMentionSearch(picker && !limitReached ? picker.query : null);
  const groups = useMemo(
    () =>
      picker && !limitReached
        ? pickerGroups({
            query: picker.query,
            response: search.response,
            taken: new Set([...chips.map((c) => c.key), ...(pageKey ? [pageKey] : [])]),
            currentPageLabel,
          })
        : [],
    [picker, limitReached, search.response, chips, pageKey, currentPageLabel],
  );
  const flat = groups.flatMap((g) => g.items);
  const activePos = flat.length ? Math.min(activeIndex, flat.length - 1) : -1;
  const active = activePos >= 0 ? flat[activePos] : undefined;
  // S6-F9: the composer or the + search field keeps the focus, so `aria-activedescendant` names the active row.
  const activeOptionId = active ? `${pickerId}-option-${activePos}` : undefined;

  // S6-F11: a new query or mode moves the highlight back to the first option.
  const pickerKey = picker ? `${picker.mode}:${picker.query}` : null;
  const [activeFor, setActiveFor] = useState(pickerKey);
  if (activeFor !== pickerKey) {
    setActiveFor(pickerKey);
    setActiveIndex(0);
  }

  /*
   * S5-C29: C1 cannot read the page of the chat (404 MEMBER_NOT_FOUND, TEAM_NOT_FOUND or JOB_NOT_FOUND). The turn
   * keeps the member's text, and the text goes back in an empty composer. Once only.
   */
  const pageErrorTurn =
    lastTurn?.status === 'error' &&
    lastTurn.error &&
    !lastTurn.textRestored &&
    lastTurn.error.mentionIndex === undefined &&
    PAGE_NOT_FOUND_CODES.has(lastTurn.error.code)
      ? lastTurn
      : null;
  useEffect(() => {
    const input = inputRef.current;
    if (!pageErrorTurn || !input) return;
    if (!input.value.trim()) setComposerText(input, pageErrorTurn.message);
    onTextRestored(pageErrorTurn.id);
  }, [pageErrorTurn, onTextRestored, inputRef, setComposerText]);

  /*
   * S6-F17: C1 cannot read one mention (404 with `mentionIndex`). The chips of that message come back with the failed
   * chip marked, and the text goes back in an empty composer. Once only.
   */
  const mentionErrorTurn =
    lastTurn?.status === 'error' && lastTurn.error?.mentionIndex !== undefined && !lastTurn.mentionsRestored
      ? lastTurn
      : null;
  // The chips come back during render (React's pattern for state that follows a prop), once per failed turn.
  const [restoredTurnId, setRestoredTurnId] = useState<string | null>(null);
  if (mentionErrorTurn && restoredTurnId !== mentionErrorTurn.id) {
    const failedIndex = mentionErrorTurn.error?.mentionIndex;
    setRestoredTurnId(mentionErrorTurn.id);
    setChips((current) =>
      current.length > 0
        ? current
        : (mentionErrorTurn.mentions ?? []).map((chip, i) => (i === failedIndex ? { ...chip, failed: true } : chip)),
    );
  }
  useEffect(() => {
    if (!mentionErrorTurn) return;
    const input = inputRef.current;
    if (input && !input.value.trim()) setComposerText(input, mentionErrorTurn.message);
    onMentionsRestored(mentionErrorTurn.id);
  }, [mentionErrorTurn, onMentionsRestored, inputRef, setComposerText]);

  const submit = (text: string) => {
    if (!send(text, mentions ? chips : [])) return false;
    if (inputRef.current) setComposerText(inputRef.current, '');
    // S6-F15: the mention chips clear after a send. The page chip stays.
    setChips([]);
    setPicker(null);
    return true;
  };

  /* S6-F10: an `@` pick puts `@<name> ` in the place of `@<query>` and adds a chip. A + pick adds a chip only. */
  const pick = (item: LabosAgentPickerItem) => {
    const el = inputRef.current;
    const current = pickerRef.current;
    if (current?.mode === 'at' && el) {
      const next = replaceAtQuery(el.value, current.start, current.query, item.mentionName);
      setNativeValue(el, next.value);
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
    } else {
      el?.focus();
    }
    if (item.restoresPage) onRestorePage?.();
    else {
      const chip = toMentionChip(item);
      if (chip) {
        setChips((prev) =>
          prev.length >= LABOS_AGENT_MAX_MENTIONS || prev.some((c) => c.key === chip.key) ? prev : [...prev, chip],
        );
      }
    }
    setPicker(null);
  };

  /* S6-F13: the chip goes. The `@name` text stays in the message. */
  const removeChip = (key: string) => {
    setChips((prev) => prev.filter((c) => c.key !== key));
    inputRef.current?.focus();
  };

  /* S6-F1, S6-F2: `@` at the start or after a space opens the picker. A space or a deleted `@` closes it. */
  const readMention = (el: HTMLTextAreaElement) => {
    if (!mentions || quietRef.current) return;
    const at = readAtQuery(el.value, el.selectionStart ?? el.value.length);
    // After Esc, the same `@` stays closed. A new `@` (or no `@`) clears the mark.
    if (at && at.start === closedAtRef.current) return;
    closedAtRef.current = null;
    if (at) setPicker({ mode: 'at', ...at });
    else if (pickerRef.current?.mode === 'at') setPicker(null);
  };

  /** Esc: closes the open picker and keeps the focus in the composer. True when a picker was open. */
  const closePicker = () => {
    const current = pickerRef.current;
    if (!current) return false;
    if (current.mode === 'at') closedAtRef.current = current.start;
    setPicker(null);
    inputRef.current?.focus();
    return true;
  };

  const togglePlus = () => setPicker((cur) => (cur?.mode === 'plus' ? null : { mode: 'plus', query: '', start: 0 }));

  /* S6-F9: Up, Down, Enter and Tab move and pick in the open picker, from the composer or the + search field. */
  const pickerKeys = (e: KeyboardEvent) => {
    if (!picker) return false;
    // S6-F9: while C4 loads and the `@` picker has no row, Enter does nothing. It does not send `@<query>`.
    if (!flat.length) {
      if (picker.mode === 'at' && search.status === 'loading' && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        return true;
      }
      return false;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const from = Math.min(activeIndex, flat.length - 1);
      setActiveIndex((from + (e.key === 'ArrowDown' ? 1 : flat.length - 1)) % flat.length);
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (active) pick(active);
      return true;
    }
    return false;
  };

  /** The composer's own keys: the picker first, Esc closes the picker, Enter sends. */
  const onComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (pickerKeys(e)) return;
    if (e.key === 'Escape' && closePicker()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit(e.currentTarget.value);
    }
  };

  /** S6-F9: in `@` mode the composer controls the picker (ARIA combobox). */
  const comboboxProps =
    picker?.mode === 'at'
      ? {
          role: 'combobox',
          'aria-expanded': true,
          'aria-autocomplete': 'list' as const,
          'aria-controls': limitReached ? undefined : listboxId,
          'aria-activedescendant': activeOptionId,
        }
      : {};

  /** The props of `LabosAgentMentionPicker` while a picker is open. */
  const pickerProps = picker
    ? {
        mode: picker.mode,
        query: picker.query,
        groups,
        activeKey: active?.key,
        listboxId,
        optionIdPrefix: `${pickerId}-option`,
        activeOptionId,
        status: search.status,
        limitReached,
        onQuery: (q: string) => setPicker({ mode: 'plus', query: q, start: 0 }),
        onKeyDown: pickerKeys,
        onHover: (key: string) =>
          setActiveIndex(
            Math.max(
              0,
              flat.findIndex((f) => f.key === key),
            ),
          ),
        onPick: pick,
      }
    : null;

  return {
    chips,
    removeChip,
    picker,
    pickerProps,
    limitReached,
    togglePlus,
    closePicker,
    comboboxProps,
    submit,
    setComposerText,
    readMention,
    onComposerKeyDown,
  };
}
