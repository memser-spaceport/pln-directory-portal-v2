'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type RefObject,
  type SyntheticEvent,
} from 'react';

import { useMembersSearch } from '@/services/members/hooks/useMembersSearch';
import type { MentionMemberItem, MentionDropdownRef } from '@/components/ui/MentionDropdown';
import type { IFeedCommentMention } from '@/types/feed.types';

export type SelectedMention = Pick<IFeedCommentMention, 'uid' | 'name'>;

interface UseFeedCommentMentionsParams {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onValueChange: (next: string) => void;
  maxLength: number;
  onMentionInserted?: (item: MentionMemberItem, query: string) => void;
}

interface ActiveMention {
  /** Index of the trigger `@` in the input value. */
  startIndex: number;
  /** Text between the `@` and the caret (no whitespace, or it wouldn't be active). */
  query: string;
  /** Dropdown anchor relative to the input's positioned ancestor. */
  position: { top: number; left: number };
}

/**
 * @-mention adapter for a PLAIN single-line <input> — the first non-Quill
 * mention surface in the app. Deliberately does NOT reuse RichTextEditor's
 * useMentionKeyboard: that hook binds a document-level keydown that
 * preventDefaults Enter/Tab/Escape unconditionally while open (so Enter is
 * swallowed forever on empty results, and Escape would close the surrounding
 * modal, not just the dropdown). Input-local handlers give per-instance
 * gating, stopPropagation, and IME guards instead.
 *
 * Event contract: detection runs on change + select (the selection event) —
 * never on keydown, which fires before the default action mutates
 * value/selection. All inputRef reads happen inside handlers/effects
 * (react-hooks/refs rule).
 *
 * The component owns the draft string; this hook only owns mention state.
 */
export function useFeedCommentMentions({
  inputRef,
  value,
  onValueChange,
  maxLength,
  onMentionInserted,
}: UseFeedCommentMentionsParams) {
  const [mention, setMention] = useState<ActiveMention | null>(null);
  const [selectedMentions, setSelectedMentions] = useState<SelectedMention[]>([]);
  // Caret target applied in a layout effect: inside the handler the DOM still
  // holds the old value (React 19 batches the state update), so a same-tick
  // setSelectionRange would be clobbered when React commits and the browser
  // resets the caret to the end. The layout effect runs post-commit,
  // pre-paint — no visible flicker frame.
  const [pendingCaret, setPendingCaret] = useState<number | null>(null);
  const dropdownRef = useRef<MentionDropdownRef>(null);
  // Escape remembers the exact context it dismissed so a caret move within the
  // same span doesn't instantly reopen the dropdown; typing (query change)
  // clears the dismissal naturally by no longer matching.
  const dismissedRef = useRef<{ startIndex: number; query: string } | null>(null);

  const query = mention?.query ?? '';
  const { results, isLoading } = useMembersSearch(query, { enabled: mention !== null });

  // Stale-results guard: useMembersSearch's internal debounce keeps its
  // previous results for ~300ms after the term changes (and after reopen), so
  // raw results can belong to a query the user is no longer typing. Stamp
  // every adopted result set with the query current at adoption time and show
  // nothing (as loading) until the stamp matches.
  const [display, setDisplay] = useState<{ query: string; items: MentionMemberItem[] }>({ query: '', items: [] });
  useEffect(() => {
    setDisplay({ query, items: results });
    // `query` is deliberately not a dependency: adoption happens only when new
    // results land, stamped with whatever the query is at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);
  const items = display.query === query ? display.items : [];
  const showLoading = isLoading || (query !== '' && display.query !== query);

  useLayoutEffect(() => {
    if (pendingCaret === null) return;
    const el = inputRef.current;
    if (el) el.setSelectionRange(pendingCaret, pendingCaret);
    setPendingCaret(null);
  }, [pendingCaret, inputRef]);

  const close = () => setMention(null);

  const dismiss = () => {
    if (mention) dismissedRef.current = { startIndex: mention.startIndex, query: mention.query };
    close();
  };

  /** Recompute the active mention context from the LIVE input state. */
  const detect = (el: HTMLInputElement) => {
    const caret = el.selectionStart ?? el.value.length;
    const text = el.value;
    const at = text.lastIndexOf('@', caret - 1);

    // `@` only triggers at start-of-text or after whitespace — never mid-word
    // or inside an email address — and the caret must sit after it.
    const isTrigger = at !== -1 && (at === 0 || /\s/.test(text[at - 1])) && caret > at;
    const context = isTrigger ? text.slice(at + 1, caret) : null;

    if (context === null || /\s/.test(context)) {
      close();
      return;
    }

    if (dismissedRef.current && dismissedRef.current.startIndex === at && dismissedRef.current.query === context) {
      return; // Escaped this exact context — don't reopen until it changes.
    }
    dismissedRef.current = null;

    setMention((prev) => {
      if (prev && prev.startIndex === at && prev.query === context) return prev;
      // Anchor to the input's edge, not the caret: a single-line input needs
      // no mirror-div caret geometry.
      const position = prev?.position ?? { top: el.offsetTop + el.offsetHeight + 4, left: el.offsetLeft };
      return { startIndex: at, query: context, position };
    });
  };

  const insertMention = (item: MentionMemberItem) => {
    const el = inputRef.current;
    if (!el || !mention) return;
    // Re-read live value/caret — span state captured at the last change event
    // can be stale by the time the click lands.
    const caret = el.selectionStart ?? el.value.length;
    const text = el.value;
    const inserted = `@${item.name} `;
    const next = text.slice(0, mention.startIndex) + inserted + text.slice(caret);
    // The HTML maxLength attribute doesn't constrain programmatic value
    // changes — enforce it here or the splice can exceed the server cap.
    if (next.length > maxLength) {
      close();
      return;
    }
    onValueChange(next);
    setPendingCaret(mention.startIndex + inserted.length);
    setSelectedMentions((prev) => [...prev, { uid: item.uid, name: item.name }]);
    onMentionInserted?.(item, mention.query);
    close();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.currentTarget.value);
    detect(e.currentTarget);
  };

  // React's `select` event fires on every selection/caret change, including
  // mouse repositioning — keydown can't see post-key caret state, this can.
  const handleSelectionChange = (e: SyntheticEvent<HTMLInputElement>) => {
    detect(e.currentTarget);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!mention) return; // Dropdown closed — Enter submits the form as usual.
    // IME guard: keyCode 229 covers Safari/Android where isComposing can be
    // false on the composition-ending Enter.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        dropdownRef.current?.moveDown();
        break;
      case 'ArrowUp':
        e.preventDefault();
        dropdownRef.current?.moveUp();
        break;
      case 'Enter':
      case 'Tab': {
        // Never submit from this keystroke; with no selectable item (empty
        // results) just close, so the NEXT Enter submits.
        e.preventDefault();
        const selected = dropdownRef.current?.selectCurrent() ?? false;
        if (!selected) close();
        break;
      }
      case 'Escape':
        e.preventDefault();
        // The dropdown must close, the surrounding modal must not.
        e.stopPropagation();
        dismiss();
        break;
    }
  };

  const handleBlur = () => {
    // Focus loss closes the dropdown. Option clicks never blur: the dropdown
    // wrapper preventDefaults mousedown (see component), so no timers, no
    // blur/click race. (Outside clicks are owned by MentionDropdown's own
    // document-mousedown listener.)
    close();
  };

  const clearMentions = () => {
    setSelectedMentions([]);
    dismissedRef.current = null;
    close();
  };

  return {
    isOpen: mention !== null,
    dropdownRef,
    dropdownProps: {
      items,
      isLoading: showLoading,
      onSelect: insertMention,
      onClose: close,
      position: mention?.position ?? null,
      searchQuery: query,
    },
    inputHandlers: {
      onChange: handleChange,
      onSelect: handleSelectionChange,
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
    },
    selectedMentions,
    clearMentions,
  };
}
