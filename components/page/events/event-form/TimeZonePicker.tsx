'use client';

import clsx from 'clsx';
import { type KeyboardEvent, useCallback, useId, useMemo, useRef, useState } from 'react';

import { ChevronDownIcon, GlobeIcon } from '@/components/icons';

import { searchTimeZones, timeZoneLabel, timeZoneOptions } from './timeZoneOptions';
import { useDismiss } from './useDismiss';
import s from './TimeZonePicker.module.scss';

interface Props {
  /** IANA name, empty while none is picked. */
  value: string;
  onChange: (zone: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/** The event's time zone: a button that opens a searchable list of IANA zones, each with its current UTC offset. */
export function TimeZonePicker({ value, onChange, disabled, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const close = useCallback(() => setOpen(false), []);
  useDismiss(rootRef, open, close);

  // The list is built when the picker opens, so each offset is the one the zone has now.
  const options = useMemo(() => (open ? timeZoneOptions(value) : []), [open, value]);
  const found = useMemo(() => searchTimeZones(options, search), [options, search]);
  const current = value ? timeZoneLabel(value) : 'Select timezone';

  const toggle = () => {
    setSearch('');
    setActive(0);
    setOpen((was) => !was);
  };

  const pick = (zone: string) => {
    setOpen(false);
    triggerRef.current?.focus();
    if (zone !== value) onChange(zone);
  };

  const move = (to: number) => {
    if (!found.length) return;
    const next = (to + found.length) % found.length;
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView?.({ block: 'nearest' });
  };

  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(active + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(active - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (found[active]) pick(found[active].value);
    } else if (event.key === 'Escape') {
      triggerRef.current?.focus();
    }
  };

  return (
    <div className={s.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={clsx(s.trigger, invalid && s.invalid)}
        aria-label={`Time zone: ${current}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-invalid={invalid || undefined}
        disabled={disabled}
        onClick={toggle}
      >
        <GlobeIcon className={s.icon} aria-hidden />
        <span className={s.text}>{current}</span>
        <ChevronDownIcon className={s.icon} aria-hidden />
      </button>
      {open && (
        <div className={s.popover}>
          <input
            type="text"
            className={s.search}
            placeholder="Search timezone"
            aria-label="Search timezone"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={found[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            autoFocus
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setActive(0);
            }}
            onKeyDown={onSearchKey}
          />
          <ul className={s.list} id={listId} ref={listRef} role="listbox" aria-label="Time zones">
            {found.map((option, index) => (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={clsx(s.option, index === active && s.optionActive, option.value === value && s.optionOn)}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(option.value)}
              >
                {option.label}
              </li>
            ))}
          </ul>
          {!found.length && (
            <p className={s.none} role="status">
              No timezones found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
