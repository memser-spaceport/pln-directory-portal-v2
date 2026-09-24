'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { clsx } from 'clsx';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { AiAppAccessCandidate } from '@/services/ai-apps/ai-apps.service';
import { useAiAppAccessCandidates } from '@/services/ai-apps/hooks/useAiAppAccessCandidates';

import s from './AiAppMemberSearch.module.scss';

interface Props {
  appUid: string;
  /** Members already on the (unsaved) list, so results show "Added". */
  addedUids: string[];
  onAdd: (candidate: AiAppAccessCandidate) => void;
  disabled?: boolean;
  /** Lets the parent modal hand Escape to the open dropdown instead of closing. */
  onDropdownChange?: (open: boolean) => void;
}

/**
 * Name search over directory members for an app's whitelist. Members without
 * AI Apps access are hidden: they could never open the app, and the backend
 * rejects them on save.
 */
export function AiAppMemberSearch({ appUid, addedUids, onAdd, disabled, onDropdownChange }: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { results: candidates, isSearching, isIdle } = useAiAppAccessCandidates(appUid, term);
  const results = candidates.filter((candidate) => candidate.hasAiAppsAccess);

  const added = new Set(addedUids);
  const isSelectable = (candidate: AiAppAccessCandidate) => !added.has(candidate.uid);

  const select = (candidate: AiAppAccessCandidate) => {
    if (!isSelectable(candidate)) return;
    onAdd(candidate);
    setTerm('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const moveActive = (step: 1 | -1) => {
    if (!results.length) return;
    let next = activeIndex;
    for (let i = 0; i < results.length; i += 1) {
      next = (next + step + results.length) % results.length;
      if (isSelectable(results[next])) {
        setActiveIndex(next);
        return;
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      moveActive(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      moveActive(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) select(results[activeIndex]);
    } else if (e.key === 'Escape') {
      // The modal ignores Escape while the dropdown is open, so this only closes the list.
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && !isIdle;

  useEffect(() => {
    onDropdownChange?.(showDropdown);
  }, [showDropdown, onDropdownChange]);

  return (
    <div>
      <input
        ref={inputRef}
        className={s.input}
        type="text"
        value={term}
        placeholder="Search members by name"
        onChange={(e) => {
          setTerm(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
      />
      {showDropdown && (
        <ul id={listId} className={s.dropdown} role="listbox">
          {isSearching && results.length === 0 && <li className={s.state}>Searching…</li>}
          {!isSearching && results.length === 0 && <li className={s.state}>No members found</li>}
          {results.map((candidate, index) => {
            const isAdded = added.has(candidate.uid);
            const selectable = isSelectable(candidate);
            return (
              <li
                key={candidate.uid}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                aria-disabled={!selectable}
                className={clsx(s.option, {
                  [s.optionActive]: index === activeIndex,
                  [s.optionDisabled]: !selectable,
                })}
                // mousedown, not click: keeps focus in the input so onBlur doesn't close the list first.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(candidate);
                }}
                onMouseEnter={() => selectable && setActiveIndex(index)}
              >
                <img
                  className={s.avatar}
                  src={candidate.image || getDefaultAvatar(candidate.name)}
                  alt=""
                  width={28}
                  height={28}
                />
                <span className={s.text}>
                  <span className={s.name}>{candidate.name}</span>
                  {candidate.teamName && <span className={s.team}>{candidate.teamName}</span>}
                </span>
                {isAdded && <span className={s.hint}>Added</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
