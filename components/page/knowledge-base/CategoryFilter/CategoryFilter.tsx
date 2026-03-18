'use client';

import React from 'react';
import clsx from 'clsx';
import s from './CategoryFilter.module.scss';

interface Props {
  categories: string[];
  activeCategory: string | null;
  onChange: (cat: string | null) => void;
}

export function CategoryFilter({ categories, activeCategory, onChange }: Props) {
  return (
    <div className={s.root}>
      <button
        className={clsx(s.pill, { [s.active]: activeCategory === null })}
        onClick={() => onChange(null)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          className={clsx(s.pill, { [s.active]: activeCategory === cat })}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
