'use client';

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

import { LABOS_AGENT_CONTEXT_TEXT, LABOS_AGENT_MENTION_TEXT } from '@/services/labos-agent/constants';
import type { LabosAgentMentionSearchStatus } from '@/services/labos-agent/hooks/useLabosAgentMentionSearch';
import { PICKER_GROUP_LABELS, type LabosAgentPickerGroup } from '@/services/labos-agent/labos-agent.mentions';
import type { LabosAgentPickerItem } from '@/types/labos-agent.types';

import s from './LabosAgentMentionPicker.module.scss';

interface LabosAgentMentionPickerProps {
  /** `at`: `@` in the composer opened it, and the composer is the search field. `plus`: the + button, with its own field. */
  mode: 'at' | 'plus';
  query: string;
  groups: LabosAgentPickerGroup[];
  activeKey?: string;
  /** The listbox id, for `aria-controls` on the composer or the + search field. */
  listboxId: string;
  /** Option `i` (in flat order) gets the id `<optionIdPrefix>-<i>`. */
  optionIdPrefix: string;
  activeOptionId?: string;
  status: LabosAgentMentionSearchStatus;
  /** S6-F12: 5 mention chips. The picker shows the limit text and no rows. */
  limitReached: boolean;
  onQuery: (query: string) => void;
  /** Up, Down, Enter and Tab from the + search field. True when the picker used the key. */
  onKeyDown: (e: React.KeyboardEvent) => boolean;
  onHover: (key: string) => void;
  onPick: (item: LabosAgentPickerItem) => void;
}

/**
 * The @mention picker of the agent (LAB-3318, prototype `prototypes/entries/agent` `ContextPicker`). One picker for
 * `@` and +. Groups: Pages, News, Teams, Members (S6-F6). The keyboard rules are the Forum mention rules
 * (`MentionDropdown`): Up, Down, Enter and Tab pick, Esc closes.
 */
export function LabosAgentMentionPicker({
  mode,
  query,
  groups,
  activeKey,
  listboxId,
  optionIdPrefix,
  activeOptionId,
  status,
  limitReached,
  onQuery,
  onKeyDown,
  onHover,
  onPick,
}: LabosAgentMentionPickerProps) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // jsdom has no scrollIntoView.
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [activeKey]);

  const trimmed = query.trim();
  const empty = groups.length === 0;
  let position = 0;

  return (
    <div className={s.picker} role="dialog" aria-labelledby={`${listboxId}-title`}>
      {/* LAB-3429 Decision 5: the heading, from + and from @ alike. */}
      <div id={`${listboxId}-title`} className={s.title}>
        {LABOS_AGENT_CONTEXT_TEXT.pickerTitle}
      </div>
      {mode === 'plus' && (
        <input
          autoFocus
          className={s.search}
          placeholder="Search pages, news, teams, members"
          value={query}
          maxLength={30}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => onKeyDown(e)}
          aria-label="Search what to add"
          role="combobox"
          aria-expanded
          aria-autocomplete="list"
          aria-controls={limitReached ? undefined : listboxId}
          aria-activedescendant={activeOptionId}
        />
      )}
      <div className={s.hint} data-testid="labos-agent-picker-hint">
        {trimmed ? LABOS_AGENT_MENTION_TEXT.hintMatching(trimmed) : LABOS_AGENT_MENTION_TEXT.hintEmpty}
      </div>
      {limitReached ? (
        <p className={s.note}>{LABOS_AGENT_MENTION_TEXT.limitReached}</p>
      ) : (
        <div ref={listRef} id={listboxId} className={s.list} role="listbox" aria-label="Items to add">
          {groups.map((g) => (
            <div key={g.kind} role="group" aria-label={PICKER_GROUP_LABELS[g.kind]}>
              <div className={s.group}>{PICKER_GROUP_LABELS[g.kind]}</div>
              {g.items.map((item) => (
                <button
                  key={item.key}
                  id={`${optionIdPrefix}-${position++}`}
                  type="button"
                  role="option"
                  aria-selected={activeKey === item.key}
                  data-active={activeKey === item.key}
                  className={s.item}
                  onMouseEnter={() => onHover(item.key)}
                  // Keep the focus in the composer, so the `@` text and the caret stay.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPick(item)}
                >
                  <span className={clsx(s.glyph, s[`glyph_${item.kind}`])} aria-hidden>
                    {item.label.slice(0, 1).toUpperCase()}
                  </span>
                  <span className={s.text}>
                    <span className={s.label}>{item.label}</span>
                    {item.meta && <span className={s.meta}>{item.meta}</span>}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
      {/* The search notes sit outside the listbox, in a live region, so a screen reader reads them. */}
      {!limitReached && (
        <div role="status" className={s.status}>
          {status === 'error' && <p className={s.note}>{LABOS_AGENT_MENTION_TEXT.searchFailed}</p>}
          {status === 'loading' && <p className={s.note}>{LABOS_AGENT_MENTION_TEXT.searching}</p>}
          {status === 'ready' && empty && <p className={s.note}>Nothing matches &quot;{trimmed}&quot;.</p>}
        </div>
      )}
    </div>
  );
}
