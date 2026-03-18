'use client';

import React, { useRef } from 'react';
import s from './SearchBar.module.scss';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search articles...' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={s.root}>
      <SearchIcon />
      <input
        ref={inputRef}
        className={s.input}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button className={s.clear} onClick={() => onChange('')} aria-label="Clear search">
          <ClearIcon />
        </button>
      )}
    </div>
  );
}

const SearchIcon = () => (
  <svg className={''} width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: '#94a3b8' }}>
    <path
      d="M14 14L10.0667 10.0667M11.3333 6.66667C11.3333 9.24399 9.24399 11.3333 6.66667 11.3333C4.08934 11.3333 2 9.24399 2 6.66667C2 4.08934 4.08934 2 6.66667 2C9.24399 2 11.3333 4.08934 11.3333 6.66667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClearIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
      stroke="#94a3b8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);
