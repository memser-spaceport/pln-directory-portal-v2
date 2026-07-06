'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

import { SearchIcon } from '@/components/icons';
// Production search field, reused 1:1 for its built-in states (debounced input,
// clear button, focus/hover ring). Here it lives behind an expand-on-click icon.
import { SearchInput } from '@/components/common/filters/SearchInput';

import local from './NewsfeedV0.module.scss';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Header search that stays a single icon button until clicked, then expands
 * inline into the production SearchInput (auto-focused). It collapses again on
 * blur only while empty — a live query keeps it open so the field never hides
 * an active filter.
 */
export function HeaderSearch({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Focus the field the moment it expands.
  useEffect(() => {
    if (open) wrapRef.current?.querySelector('input')?.focus();
  }, [open]);

  // Collapse when focus leaves the control if the field is empty. Read the live
  // input value (not the debounced `value` prop) so a just-typed/just-cleared
  // field is judged by what's actually on screen.
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (wrapRef.current?.contains(e.relatedTarget as Node)) return;
    const live = wrapRef.current?.querySelector('input')?.value ?? '';
    if (!live.trim()) setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        className={local.headerSearchBtn}
        aria-label="Search news"
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <div className={clsx(local.headerSearchField)} ref={wrapRef} onBlur={handleBlur}>
      <SearchInput value={value} onChange={onChange} placeholder="Search news, teams…" />
    </div>
  );
}
