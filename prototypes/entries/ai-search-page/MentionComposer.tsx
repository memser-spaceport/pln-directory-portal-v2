'use client';

/**
 * @mentions in AI agent chat (2026-11-26: "add @mentions to AI agent chat when AI chat and agent
 * are the same"). When the chat IS the agent, its composer points at things the way the agent's does:
 *
 *  - "@" right after a space (or at the start) opens the agent's own picker (`agent/AgentChat` ContextPicker,
 *    imported, not forked): pages, news, teams, members, events, forum, filtered by what follows the "@".
 *    Arrows + Enter/Tab pick, Esc closes.
 *  - Picking writes a short @name into the sentence AND shows the item as a context chip inside the field,
 *    above the text: the agent's rule ("the reference is in the sentence and in the context").
 *  - The chips are read FROM the text, so they can't disagree with it: delete the @name and its chip goes;
 *    ✕ on a chip takes the @name out of the sentence. Sending clears both.
 *  - On send, the page resolves the @names again (`mentionsIn`) and the agent reads those items with the
 *    message, so "@Lattice Compute what are they hiring for?" answers about Lattice Compute.
 *
 * Without a MentionContext value (versions 1 and 3, or a chat scoped to one profile) it is the plain Composer.
 */

import React, { createContext, useContext, useImperativeHandle, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { X } from '@phosphor-icons/react';

import corner from '../home-v2-agent-dock/AgentCorner.module.scss';
import { ContextPicker, mentionName, pickerGroups, setNativeValue } from '../agent/AgentChat';
import { ItemGlyph, type AgentItem } from '../agent/items';
import Composer from './Composer';
import s from './AiSearchPage.module.scss';

export type MentionSource = {
  /** Everything an @ can name. */
  catalog: AgentItem[];
  /** Listed first before anything is typed (recently viewed pages). */
  suggested: AgentItem[];
};

export const MentionContext = createContext<MentionSource | null>(null);

/**
 * What a message @mentions (suggested pages and the catalog), in the order it names them. A profile page reads
 * as its team or member: in the agent, a page is where you are; here it is the thing you're asking about.
 */
export function mentionsIn(text: string, { catalog, suggested }: MentionSource): AgentItem[] {
  const seen = new Set<string>();
  return [...suggested, ...catalog]
    .map((item) => ({ item, at: text.indexOf(`@${mentionName(item)}`) }))
    .filter(({ item, at }) => {
      const name = mentionName(item);
      if (at < 0 || seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .sort((a, b) => a.at - b.at)
    .map(({ item }) =>
      item.kind !== 'page' || !item.page || item.page === 'home' || item.page === 'jobs'
        ? item
        : { ...item, kind: item.page === 'team' ? ('team' as const) : ('member' as const) },
    );
}

type ComposerProps = React.ComponentProps<typeof Composer> & {
  /** Off for a chat scoped to one profile: those answers come from the profile, not the agent. */
  noMentions?: boolean;
};

const MentionComposer = React.forwardRef<HTMLTextAreaElement, ComposerProps>(function MentionComposer(
  { noMentions, onChange, onKeyDown, onTextSubmit, onBlur, leading, className, defaultValue, ...props },
  ref,
) {
  const source = useContext(MentionContext);
  const src = noMentions ? null : source;
  const on = !!src;

  const inputRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLTextAreaElement);

  const [text, setText] = useState(String(defaultValue ?? ''));
  const [picker, setPicker] = useState<{ query: string; start: number } | null>(null);
  const [active, setActive] = useState(0);

  /* The parent clears the field directly after a send (no change event): re-read it on the next frame. */
  const resync = () => requestAnimationFrame(() => setText(inputRef.current?.value ?? ''));

  const mentioned = useMemo(() => (src ? mentionsIn(text, src) : []), [src, text]);
  const groups = useMemo(
    () => (src && picker ? pickerGroups(picker.query, mentioned, src.catalog, src.suggested) : []),
    [src, picker, mentioned],
  );
  const flat = groups.flatMap((g) => g.items);

  const readMention = (el: HTMLTextAreaElement) => {
    const upto = el.value.slice(0, el.selectionStart ?? el.value.length);
    const m = upto.match(/(^|\s)@([^\s@]{0,30})$/);
    if (m && m[2] !== picker?.query) setActive(0);
    setPicker(m ? { query: m[2], start: upto.length - m[2].length - 1 } : null);
  };

  const pick = (item: AgentItem) => {
    const el = inputRef.current;
    if (!el || !picker) return;
    const before = el.value.slice(0, picker.start);
    const after = el.value.slice(picker.start + 1 + picker.query.length).replace(/^\s/, '');
    const insert = `@${mentionName(item)} `;
    setNativeValue(el, `${before}${insert}${after}`);
    const caret = before.length + insert.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
    setPicker(null);
  };

  const unmention = (item: AgentItem) => {
    const el = inputRef.current;
    if (!el) return;
    setNativeValue(el, el.value.replace(`@${mentionName(item)} `, '').replace(`@${mentionName(item)}`, ''));
    el.focus();
  };

  const pickerKeys = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!picker) return false;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setPicker(null);
      return true;
    }
    if (!flat.length) return false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : flat.length - 1)) % flat.length);
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      pick(flat[Math.min(active, flat.length - 1)]);
      return true;
    }
    return false;
  };

  const chips = mentioned.map((item) => (
    <span key={item.id} className={corner.contextChip} title={`The agent reads ${item.label} with this message`}>
      <ItemGlyph item={item} />
      <span className={clsx(corner.contextLabel, s.mentionChipLabel)}>{item.label}</span>
      <button
        type="button"
        className={corner.contextRemove}
        aria-label={`Remove @${mentionName(item)}`}
        onClick={() => unmention(item)}
      >
        <X weight="bold" />
      </button>
    </span>
  ));

  return (
    <div className={clsx(s.mentionWrap, props.size === 'home' && s.mentionWrapHome)}>
      {on && picker && (
        <ContextPicker
          mode="at"
          query={picker.query}
          groups={groups}
          active={flat[Math.min(active, flat.length - 1)]?.id}
          onQuery={() => {}}
          onKeyDown={() => false}
          onHover={(id) => setActive(flat.findIndex((f) => f.id === id))}
          onPick={pick}
        />
      )}
      <Composer
        {...props}
        ref={inputRef}
        className={className}
        defaultValue={defaultValue}
        leading={
          leading || chips.length ? (
            <span className={s.mentionChips} aria-label="What the agent reads">
              {leading}
              {chips}
            </span>
          ) : undefined
        }
        onChange={(e) => {
          setText(e.currentTarget.value);
          if (on) readMention(e.currentTarget);
          onChange?.(e);
        }}
        onKeyDown={(e) => {
          if (on && pickerKeys(e)) return;
          onKeyDown?.(e);
          if (e.key === 'Enter' && !e.shiftKey) resync();
        }}
        onBlur={(e) => {
          setPicker(null);
          onBlur?.(e);
        }}
        onTextSubmit={() => {
          onTextSubmit?.();
          resync();
        }}
      />
    </div>
  );
});

export default MentionComposer;
